import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigation } from 'react-router-dom';
import type { NavigationResult } from '../webMcp/types';
import {
  normalizeHrefInRuntime,
  pathnameToRouteService,
  usePage,
  useWebMcp,
} from '@rspress/core/runtime';
import { usePrevNextPage } from '../logic/usePrevNextPage';
import {
  defineTool,
  resolveInternalRoute,
  routePathField,
} from '../webMcp/tools';

/**
 * Creates an awaitable navigation callback that resolves after React commits
 * the destination page context. Rejects superseded or cancelled requests;
 * cancellation stops waiting without undoing an already started navigation.
 * @param result Metadata for the currently rendered page.
 * @returns A callback accepting a canonical route and optional abort signal.
 * @unstable
 */
function useAwaitedNavigation(result: NavigationResult) {
  const location = useLocation();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const snapshot = useRef({ result, location, state: navigation.state });
  const pending = useRef<
    | {
        target: string;
        startKey: string;
        done: boolean;
        resolve: (result: NavigationResult) => void;
        reject: (error: Error) => void;
        cleanup: () => void;
      }
    | undefined
  >(undefined);

  const settle = useCallback(() => {
    const request = pending.current;
    const current = snapshot.current;
    if (
      !request?.done ||
      current.state !== 'idle' ||
      current.location.key === request.startKey
    )
      return;
    pending.current = undefined;
    request.cleanup();
    if (current.result.routePath === request.target) {
      request.resolve(current.result);
    } else {
      request.reject(new Error('Navigation was superseded by another route.'));
    }
  }, []);

  useLayoutEffect(() => {
    snapshot.current = { result, location, state: navigation.state };
    settle();
  });

  useLayoutEffect(
    () => () => {
      pending.current?.cleanup();
      pending.current?.reject(
        new Error('Navigation failed or the page runtime was unmounted.'),
      );
      pending.current = undefined;
    },
    [],
  );

  return useCallback(
    (target: string, signal?: AbortSignal): Promise<NavigationResult> => {
      signal?.throwIfAborted();
      pending.current?.cleanup();
      pending.current?.reject(
        new Error('Navigation was superseded by another tool call.'),
      );
      pending.current = undefined;
      // Even the current route must supersede a transition not yet committed by React.
      return new Promise((resolve, reject) => {
        const cancel = () => {
          if (pending.current === request) pending.current = undefined;
          request.cleanup();
          reject(
            signal?.reason ??
              new DOMException('Navigation cancelled.', 'AbortError'),
          );
        };
        const request = {
          target,
          startKey: snapshot.current.location.key,
          done: false,
          resolve,
          reject,
          cleanup: () => signal?.removeEventListener('abort', cancel),
        };
        pending.current = request;
        signal?.addEventListener('abort', cancel, { once: true });
        void Promise.resolve()
          .then(() => {
            if (pending.current === request)
              return navigate(normalizeHrefInRuntime(target));
          })
          .then(() => {
            if (pending.current !== request) return;
            request.done = true;
            settle();
          })
          .catch(error => {
            if (pending.current === request) pending.current = undefined;
            request.cleanup();
            reject(error);
          });
      });
    },
    [navigate, settle],
  );
}

/**
 * Registers `rspress_navigate` for known internal routes. Waits for committed
 * page context before returning metadata, section routes, and adjacent pages.
 * @unstable
 */
export function useWebMcpNavigation() {
  const { page } = usePage();
  const location = useLocation();
  const resolveRoute = (pathname: string) =>
    pathnameToRouteService(pathname)?.path;
  const { prevPage, nextPage } = usePrevNextPage();
  const toLink = (item: typeof prevPage) => {
    if (!item?.link) return null;
    try {
      return {
        title: item.text,
        routePath: resolveInternalRoute(item.link, {
          origin: window.location.origin,
          resolveRoute,
        }),
      };
    } catch {
      return null;
    }
  };
  const result: NavigationResult = {
    routePath: `${page.routePath}${location.search}${location.hash}`,
    page: {
      title: page.title,
      description: page.description,
      lang: page.lang,
      version: page.version,
    },
    sections: page.toc.map(section => ({
      title: section.text,
      depth: section.depth,
      routePath: `${page.routePath}${location.search}#${section.id}`,
    })),
    previousPage: toLink(prevPage),
    nextPage: toLink(nextPage),
  };
  const navigate = useAwaitedNavigation(result);
  useWebMcp(
    defineTool(
      'navigate',
      'Navigate to a known internal documentation route and return the rendered page metadata, section routes and adjacent pages. Paths are relative to the site base and may include a query or hash.',
      { routePath: routePathField },
      ['routePath'],
      (args, signal) =>
        navigate(
          resolveInternalRoute(args.routePath as string, {
            origin: window.location.origin,
            resolveRoute,
          }),
          signal,
        ),
    ),
  );
}
