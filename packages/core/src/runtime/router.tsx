import type { Route } from '@rspress/shared';
import {
  createBrowserRouter,
  useMatches,
  type StaticHandlerContext
} from 'react-router-dom';

// This is a workaround for react v6
import { createStaticRouter, StaticRouterProvider, createStaticHandler } from 'react-router-dom/server'

import { App } from './App';
import { PageContext } from './hooks/usePage';
import type { Page } from './initPageData';

function AppShell() {
  const matches = useMatches();
  const currentMatch = matches[matches.length - 1];
  const pageData = currentMatch?.data as Page | undefined;

  return (
    <PageContext.Provider value={{ data: pageData }}>
      <App />
    </PageContext.Provider>
  );
}

function toRouteObject(route: Route, index: number) {
  return {
    id: `rspress-route-${index}`,
    path: route.path,
    loader: route.loader,
    Component: route.Component,
  };
}

export function createRspressBrowserRouter(routes: Route[], basename: string) {
  return createBrowserRouter([
    {
      id: 'rspress-app-shell',
      path: '/',
      Component: AppShell,
      children: routes.map((route, index) => toRouteObject(route, index)),
    },
  ], { basename });
}

export function createRspressStaticRouter(
  routes: Route[],
  context: StaticHandlerContext,
) {
  return createStaticRouter(
    [
      {
        id: 'rspress-app-shell',
        path: '/',
        Component: AppShell,
        children: routes.map((route, index) => toRouteObject(route, index)),
      },
    ],
    context,
  );
}

export { StaticRouterProvider, createStaticHandler };

