import { type Route, addTrailingSlash } from '@rspress/shared';
import { routes } from '__VIRTUAL_ROUTES__';
import { matchRoutes } from 'react-router-dom';
import { withBase } from './utils';

export function normalizeRoutePath(routePath: string) {
  return decodeURIComponent(routePath)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');
}

/**
 * match the sidebar key in user config
 * @param pattern /zh/guide
 * @param currentPathname /base/zh/guide/getting-started
 */
export const matchSidebar = (
  pattern: string,
  currentPathname: string,
): boolean => {
  const prefix = withBase(pattern);
  if (prefix === currentPathname) {
    return true;
  }
  const prefixWithTrailingSlash = addTrailingSlash(prefix);
  if (currentPathname.startsWith(prefixWithTrailingSlash)) {
    return true;
  }

  // be compatible with api-extractor
  // '/api/react': [
  //   { link: '/api/react.use' }
  // ]
  const prefixWithDot = `${prefix}.`;
  return currentPathname.startsWith(prefixWithDot);
};

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
