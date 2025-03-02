import type { Route } from '@rspress/shared';
import { routes } from '__VIRTUAL_ROUTES__';
import { matchRoutes } from 'react-router-dom';

export function normalizeRoutePath(routePath: string) {
  return decodeURIComponent(routePath)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');
}

const cache = new Map<string, Route>();
/**
 * this is a bridge of two core features Sidebar and RouteService
 * @param pathname useLocation().pathname
 * @returns
 */
export function pathnameToRouteService(pathname: string): Route | undefined {
  const cacheItem = cache.get(pathname);
  if (cacheItem) {
    return cacheItem;
  }
  const matched = matchRoutes(routes, normalizeRoutePath(pathname));
  const route: Route | undefined = matched?.[0]?.route;
  if (route) {
    cache.set(pathname, route);
  }
  return route;
}
