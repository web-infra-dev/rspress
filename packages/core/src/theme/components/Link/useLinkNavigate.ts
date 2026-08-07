import {
  initPageData,
  isActive,
  pathnameToRouteService,
  useLocation,
  useNavigate as useNavigateInner,
  useSite,
  warmPageData,
} from '@rspress/core/runtime';
import nprogress from 'nprogress';
import {
  startTransition as reactStartTransition,
  type TransitionStartFunction,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { getHref } from './getHref';

nprogress.configure({ showSpinner: false });

const NAVIGATION_TIMEOUT_MS = 10_000;

interface PendingNavigation {
  cancel(error: Error): void;
  resolve(): void;
  target: string;
}

export function getAwaitedTarget(href: string, currentTarget: string): string {
  const { linkType, removeBaseHref } = getHref(href);
  const target =
    linkType === 'hashOnly'
      ? `${currentTarget.split('#')[0]}${href}`
      : removeBaseHref;
  // The router omits empty query and hash delimiters from its location.
  const url = new URL(target, 'http://rspress.local');
  return `${url.pathname}${url.search}${url.hash}`;
}

/**
 * For import { Link } from '@rspress/core/theme';
 * useNavigate with preload logic
 */
export function useLinkNavigate(
  {
    startTransition = reactStartTransition,
  }: { startTransition?: TransitionStartFunction } = {
    startTransition: reactStartTransition,
  },
): (href: string, options?: { signal?: AbortSignal }) => Promise<void> {
  const { pathname: currPagePathname } = useLocation();
  const navigate = useNavigateInner();
  const { site } = useSite();
  const useTransitions = site?.route?.useTransitions;

  return useCallback(
    async (href: string, { signal }: { signal?: AbortSignal } = {}) => {
      signal?.throwIfAborted();
      const { linkType, removeBaseHref, routePath, withBaseHref } =
        getHref(href);
      if (linkType === 'external' || linkType === 'hashOnly') {
        window.location.assign(href);
        return;
      }

      const isTransitionable = !!(useTransitions && startTransition);
      const preloadChunkThenNavigate = async () => {
        const inCurrPage = isActive(removeBaseHref, currPagePathname);

        if (!import.meta.env.SSR && !inCurrPage) {
          const matchedRoute = pathnameToRouteService(routePath);
          if (matchedRoute) {
            const timer = setTimeout(() => {
              nprogress.start();
            }, 200);
            let finished = false;
            const finishProgress = () => {
              if (finished) return;
              finished = true;
              clearTimeout(timer);
              nprogress.done();
              signal?.removeEventListener('abort', finishProgress);
            };
            signal?.addEventListener('abort', finishProgress, { once: true });
            try {
              const data = await initPageData(routePath);
              signal?.throwIfAborted();
              warmPageData(routePath, data);
            } finally {
              finishProgress();
            }
          } else {
            signal?.throwIfAborted();
            window.location.assign(withBaseHref);
            return;
          }
        }
        signal?.throwIfAborted();
        if (isTransitionable) {
          startTransition(() => {
            return navigate(removeBaseHref, { replace: false });
          });
        } else {
          navigate(removeBaseHref, { replace: false });
        }
      };

      if (isTransitionable) {
        await new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              await preloadChunkThenNavigate();
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        });
      } else {
        await preloadChunkThenNavigate();
      }
    },
    [useTransitions, currPagePathname, navigate, startTransition],
  );
}

/**
 * Navigate through the Rspress router and resolve after the target location
 * commits. Calls are serialized and failed or timed-out attempts do not
 * block later calls. External URLs and paths without a matching route reject.
 * Keep this hook mounted across navigation (for example, in a custom Root).
 *
 * @param committedTarget Optional router-relative pathname, search and hash
 * reported by an integration when its target content has committed.
 */
export function useAwaitedLinkNavigate(
  committedTarget?: string,
): (href: string) => Promise<void> {
  const navigate = useLinkNavigate();
  const { pathname, search, hash } = useLocation();
  const currentTarget = committedTarget ?? `${pathname}${search}${hash}`;
  const currentTargetRef = useRef(currentTarget);
  const activeRef = useRef(true);
  const pendingRef = useRef<PendingNavigation | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    currentTargetRef.current = currentTarget;
    const pending = pendingRef.current;
    if (pending?.target === currentTarget) {
      pendingRef.current = null;
      pending.resolve();
    }
  }, [currentTarget]);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      pendingRef.current?.cancel(new Error('Navigation was interrupted'));
      pendingRef.current = null;
    };
  }, []);

  const navigateAndWait = useCallback(
    async (href: string, target: string) => {
      const { linkType } = getHref(href);
      if (
        linkType === 'external' ||
        !pathnameToRouteService(target.split(/[?#]/)[0])
      ) {
        throw new Error('Awaited navigation requires an internal route');
      }
      const routerHref = linkType === 'hashOnly' ? target : href;
      if (currentTargetRef.current === target) {
        return;
      }

      let pending!: PendingNavigation;
      const controller = new AbortController();
      const completion = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          pending.cancel(
            new Error(
              `Navigation did not complete within ${NAVIGATION_TIMEOUT_MS}ms`,
            ),
          );
        }, NAVIGATION_TIMEOUT_MS);
        pending = {
          cancel(error) {
            clearTimeout(timeout);
            controller.abort(error);
            reject(error);
          },
          resolve() {
            clearTimeout(timeout);
            resolve();
          },
          target,
        };
        pendingRef.current = pending;
      });

      try {
        await Promise.all([
          navigate(routerHref, { signal: controller.signal }),
          completion,
        ]);
      } catch (error) {
        pending.cancel(
          error instanceof Error
            ? error
            : new Error('Navigation failed', { cause: error }),
        );
        if (pendingRef.current === pending) {
          pendingRef.current = null;
        }
        throw error;
      }
    },
    [navigate],
  );

  return useCallback(
    (href: string) => {
      const queued = queueRef.current
        .catch(() => undefined)
        .then(() => {
          if (!activeRef.current) {
            throw new Error('Navigation was interrupted');
          }
          return navigateAndWait(
            href,
            getAwaitedTarget(href, currentTargetRef.current),
          );
        });
      queueRef.current = queued;
      return queued;
    },
    [navigateAndWait],
  );
}
