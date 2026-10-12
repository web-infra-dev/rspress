import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate, useNavigation } from 'react-router-dom';
import type { NavigationResult } from '../webMcp/types';
import {
  pathnameToRouteService,
  usePage,
  useWebMcp,
} from '@rspress/core/runtime';
import { usePrevNextPage } from '../../theme/logic/usePrevNextPage';
import {
  defineTool,
  resolveInternalRoute,
  routePathField,
} from '../webMcp/tools';

// Native navigation prepares the page. A layout effect acknowledges that React
// has committed the corresponding page context before returning it to an agent.
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
      if (
        snapshot.current.result.routePath === target &&
        snapshot.current.state === 'idle'
      ) {
        return Promise.resolve(snapshot.current.result);
      }
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
            if (pending.current === request) return navigate(target);
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
