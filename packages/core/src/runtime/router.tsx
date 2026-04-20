import type { Route } from '@rspress/shared';
import {
  createBrowserRouter,
  Outlet,
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
    __RSPRESS_DEBUG_ROUTER__?: unknown;
  }
}

function getCanonicalRoutePath(pathname: string) {
  const routePath = removeBase(pathname);
  if (routePath === '/404') {
    return '/404';
  }
  return pathnameToRouteService(routePath)?.path || routePath;
}

function AppShell() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const pageData = currentMatch?.data as Page | undefined;

  if (typeof window !== 'undefined') {
    window.__RSPRESS_DEBUG_ROUTER__ = {
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
    };
    console.warn('[rspress-debug-router]', window.__RSPRESS_DEBUG_ROUTER__);
  }

  return (
    <PageContext.Provider value={{ data: pageData }}>
      <App />
    </PageContext.Provider>
  );
}

function AliasRouteElement() {
  const { pathname } = useLocation();
  const matchedRoute = pathnameToRouteService(getCanonicalRoutePath(pathname));

  return matchedRoute?.element ?? null;
}

function CanonicalRouteOutlet() {
  return <Outlet />;
}

function toRouteObject(route: Route, index: number) {
  return {
    id: `rspress-route-${index}`,
    path: route.path,
    loader: route.loader,
    element: route.element,
  };
}

function splitRoutes(routes: Route[]) {
  const homeRoute = routes.find(route => route.path === '/');
  const notFoundRoute = routes.find(route => route.path === '/404');
  const docRoutes = routes.filter(
    route => route.path !== '/' && route.path !== '/404',
  );

  return {
    docRoutes,
    homeRoute,
    notFoundRoute,
  };
}

function createDataRoutes(routes: Route[]) {
  const { docRoutes, homeRoute, notFoundRoute } = splitRoutes(routes);
  const canonicalRoutes = [
    ...docRoutes.map((route, index) => ({
      id: `rspress-route-${index}`,
      path: route.path,
      loader: route.loader,
    })),
    ...(notFoundRoute
      ? [
          {
            id: 'rspress-route-404',
            path: '404',
            loader: notFoundRoute.loader,
          },
        ]
      : []),
    ...(homeRoute
      ? [
          {
            id: 'rspress-route-home',
            index: true,
            loader: homeRoute.loader,
          },
        ]
      : []),
  ];

  return [
    {
      id: 'rspress-app-shell',
      path: '/',
      children: [
        {
          id: 'rspress-route-canonical',
          children: canonicalRoutes,
        },
        {
          id: 'rspress-route-alias',
          path: '*',
          loader: ({ request }: { request: Request }) =>
            initPageData(getCanonicalRoutePath(new URL(request.url).pathname)),
        },
      ],
    },
  ];
}

function createAppShellRoute(routes: Route[]) {
  const { docRoutes, homeRoute, notFoundRoute } = splitRoutes(routes);
  const canonicalRoutes = [
    ...docRoutes.map((route, index) => toRouteObject(route, index)),
    ...(notFoundRoute
      ? [
          {
            ...toRouteObject(notFoundRoute, routes.indexOf(notFoundRoute)),
            id: 'rspress-route-404',
            path: '404',
          },
        ]
      : []),
    ...(homeRoute
      ? [
          {
            ...toRouteObject(homeRoute, routes.indexOf(homeRoute)),
            id: 'rspress-route-home',
            path: undefined,
            index: true,
          },
        ]
      : []),
  ];

  return {
    id: 'rspress-app-shell',
    path: '/',
    element: <AppShell />,
    children: [
      {
        id: 'rspress-route-canonical',
        element: <CanonicalRouteOutlet />,
        children: canonicalRoutes,
      },
      {
        id: 'rspress-route-alias',
        path: '*',
        loader: ({ request }: { request: Request }) =>
          initPageData(getCanonicalRoutePath(new URL(request.url).pathname)),
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

export {
  createDataRoutes,
  createStaticHandler,
  RouterProvider,
  StaticRouterProvider,
};
