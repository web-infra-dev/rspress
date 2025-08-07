import type { Route } from '@rspress/shared';
import { matchPath, matchRoutes } from 'react-router-dom';
import { routes } from 'virtual-routes';

function normalizeRoutePath(routePath: string) {
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

/**
 * link: /api/config
 * currentPathname:
 *  0. /api/config
 *  1. /api/config.html
 *  2. /api/config/
 *  3. /api/config/index
 *  4. /api/config/index.html
 * @param itemLink
 * @param currentPathname
 * @returns
 */
export function isActive(itemLink: string, currentPathname: string): boolean {
  const normalizedItemLink = normalizeRoutePath(itemLink);
  const normalizedCurrentPathname = normalizeRoutePath(currentPathname);
  const linkMatched = matchPath(normalizedItemLink, normalizedCurrentPathname);
  return linkMatched !== null;
}
