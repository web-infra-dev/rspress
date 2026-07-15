import {
  cleanUrlByConfig,
  initPageData,
  isActive,
  isExternalUrl,
  pathnameToRouteService,
  removeBase,
  useLocation,
  useNavigate as useNavigateInner,
  useSite,
  warmPageData,
  withBase,
} from '@rspress/core/runtime';
import nprogress from 'nprogress';
import {
  startTransition as reactStartTransition,
  type TransitionStartFunction,
  useCallback,
  useEffect,
  useRef,
} from 'react';

nprogress.configure({ showSpinner: false });

const NAVIGATION_TIMEOUT_MS = 10_000;

interface PendingNavigation {
  cancel(error: Error): void;
  resolve(): void;
  target: string;
}

function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('/');
}

type LinkType = 'external' | 'hashOnly' | 'relative' | 'internal';

function getLinkType(href: string): LinkType {
  if (isExternalUrl(href)) {
    return 'external';
  }
  if (href.startsWith('#')) {
    return 'hashOnly';
  }

  if (!isAbsoluteUrl(href)) {
    return 'relative';
  }

  return 'internal';
}

export function getHref(href: string): {
  withBaseHref: string;
  removeBaseHref: string;
  linkType: LinkType;
} {
  let withBaseHref;
  const linkType = getLinkType(href);

  if (linkType === 'external' || linkType === 'hashOnly') {
    return { linkType: linkType, withBaseHref: href, removeBaseHref: href };
  }

  if (linkType === 'relative' && !import.meta.env.SSR) {
    const url = new URL(href, window.location.href);
    withBaseHref = `${url.pathname}${url.search}${url.hash}`;
  } else {
    withBaseHref = withBase(cleanUrlByConfig(href));
  }
  const removeBaseHref = removeBase(withBaseHref);

  return { withBaseHref, removeBaseHref, linkType };
}

export function getAwaitedTarget(href: string, currentTarget: string): string {
  const { linkType, removeBaseHref } = getHref(href);
  return linkType === 'hashOnly'
    ? `${currentTarget.split('#')[0]}${href}`
    : removeBaseHref;
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
      const { linkType, removeBaseHref, withBaseHref } = getHref(href);
      if (linkType === 'external' || linkType === 'hashOnly') {
        window.location.assign(href);
        return;
      }

      const isTransitionable = !!(useTransitions && startTransition);
      const preloadChunkThenNavigate = async () => {
        const inCurrPage = isActive(removeBaseHref, currPagePathname);

        if (!import.meta.env.SSR && !inCurrPage) {
          const matchedRoute = pathnameToRouteService(removeBaseHref);
          if (matchedRoute) {
            const timer = setTimeout(() => {
              nprogress.start();
            }, 200);
            try {
              const data = await initPageData(removeBaseHref);
              signal?.throwIfAborted();
              warmPageData(removeBaseHref, data);
            } finally {
              clearTimeout(timer);
              nprogress.done();
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

      await preloadChunkThenNavigate();
    },
    [useTransitions, currPagePathname, navigate, startTransition],
  );
}

/**
 * Navigate through the Rspress router and resolve after the target location
 * commits. Calls are serialized and failed or timed-out attempts do not
 * block later calls.
 */
export function useAwaitedLinkNavigate(
  committedTarget?: string,
): (href: string) => Promise<void> {
  const navigate = useLinkNavigate();
  const { pathname, search, hash } = useLocation();
  const currentTarget =
    committedTarget ?? `${removeBase(pathname)}${search}${hash}`;
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
      if (currentTargetRef.current === target) {
        await navigate(href);
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
          navigate(href, { signal: controller.signal }),
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
    (target: string) => {
      const queued = queueRef.current
        .catch(() => undefined)
        .then(() => {
          if (!activeRef.current) {
            throw new Error('Navigation was interrupted');
          }
          return navigateAndWait(
            target,
            getAwaitedTarget(target, currentTargetRef.current),
          );
        });
      queueRef.current = queued;
      return queued;
    },
    [navigateAndWait],
  );
}
