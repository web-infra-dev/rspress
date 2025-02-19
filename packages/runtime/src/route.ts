import type { Route } from '@rspress/shared';
// @ts-expect-error __VIRTUAL_ROUTES__ will be determined at build time
import { routes } from '__VIRTUAL_ROUTES__';
import { matchRoutes } from 'react-router-dom';

function normalizeRoutePath(routePath: string) {
  return decodeURIComponent(routePath)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');
}

/**
 * this is a bridge of two core features Sidebar and RouteService
 * @param pathname useLocation().pathname
 * @returns
 */
export function pathnameToRouteService(pathname: string): Route | undefined {
  const matched = matchRoutes(
    routes as typeof import('virtual-routes')['routes'],
    normalizeRoutePath(pathname),
  );
  return matched?.[0]?.route;
}
