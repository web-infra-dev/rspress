import type { Route } from '@rspress/shared';
import {
  createBrowserRouter,
  RouterProvider,
  type StaticHandlerContext,
  useLocation,
  useMatches,
} from 'react-router-dom';

// This is a workaround for react-router-dom v6
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
} from 'react-router-dom/server';

import { App } from './App';
import { PageContext } from './hooks/usePage';
import type { Page } from './initPageData';
import { initPageData } from './initPageData';
import { pathnameToRouteService } from './pathnameToRouteService';
import { removeBase } from './utils';

declare global {
  interface Window {
    __RSPRESS_DEBUG_PAGE_DATA__?: unknown;
  }
}

function AppShell() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const pageData = currentMatch?.data as Page | undefined;

  if (typeof window !== 'undefined') {
    window.__RSPRESS_DEBUG_PAGE_DATA__ = {
      matches: matches.map(match => ({
        id: match.id,
        pathname: match.pathname,
        params: match.params,
        data: match.data,
      })),
      currentMatch: currentMatch
        ? {
            id: currentMatch.id,
            pathname: currentMatch.pathname,
            params: currentMatch.params,
            data: currentMatch.data,
          }
        : null,
      pageData,
    };
  }

  return (
    <PageContext.Provider value={{ data: pageData }}>
      <App />
    </PageContext.Provider>
  );
}

function AliasRouteElement() {
  const { pathname } = useLocation();
  const matchedRoute = pathnameToRouteService(pathname);

  return matchedRoute?.element ?? null;
}

function toRouteObject(route: Route, index: number) {
  return {
    id: `rspress-route-${index}`,
    path: route.path,
    loader: route.loader,
    element: route.element,
  };
}

function createAppShellRoute(routes: Route[]) {
  return {
    id: 'rspress-app-shell',
    path: '/',
    element: <AppShell />,
    children: [
      ...routes.map((route, index) => toRouteObject(route, index)),
      {
        id: 'rspress-route-alias',
        path: '*',
        loader: ({ request }: { request: Request }) =>
          initPageData(removeBase(new URL(request.url).pathname)),
        element: <AliasRouteElement />,
      },
    ],
  };
}

export function createRspressBrowserRouter(routes: Route[], basename: string) {
  return createBrowserRouter([createAppShellRoute(routes)], { basename });
}

export function createRspressStaticRouter(
  routes: Route[],
  context: StaticHandlerContext,
) {
  return createStaticRouter([createAppShellRoute(routes)], context);
}

export { createStaticHandler, RouterProvider, StaticRouterProvider };
