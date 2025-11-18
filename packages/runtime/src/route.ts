import type { Route } from '@rspress/shared';
import { cleanUrl } from '@rspress/shared';
import { routes } from 'virtual-routes';

/**
 * Normalize route path by:
 * 1. Decoding URI components
 * 2. Removing .html suffix
 * 3. Converting /index to /
 * 4. Converting to lowercase for case-insensitive matching
 *
 * Examples:
 * - /api/config → /api/config
 * - /api/config.html → /api/config
 * - /api/config/index → /api/config/
 * - /api/config/index.html → /api/config/
 * - /index.html → /
 * - /API/CONFIG → /api/config (case-insensitive)
 */
function normalizeRoutePath(routePath: string) {
  return cleanUrl(decodeURIComponent(routePath))
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/')
    .toLowerCase();
}

/**
 * Simple implementation of matchPath to check if a pattern matches a pathname
 * Better performance alternative of `import { matchPath } from 'react-router-dom'`
 * @param pattern - The route pattern to match against
 * @param pathname - The pathname to check
 * @returns Match object if matched, null otherwise
 *
 * @example
 * matchPath('/api/config', '/api/config') // { path: '/api/config' }
 * matchPath('/api/config/', '/api/config') // { path: '/api/config/' }
 * matchPath('/api/config', '/api/other') // null
 */
export function matchPath(
  pattern: string,
  pathname: string,
): { path: string } | null {
  // Normalize both pattern and pathname for comparison
  // Always add trailing slash for consistent comparison
  const normalizedPattern = normalizeRoutePath(pattern);
  const normalizedPathname = normalizeRoutePath(pathname);

  const normalizedPatternWithSlash = normalizedPattern.endsWith('/')
    ? normalizedPattern
    : `${normalizedPattern}/`;
  const normalizedPathnameWithSlash = normalizedPathname.endsWith('/')
    ? normalizedPathname
    : `${normalizedPathname}/`;

  // Exact match (case-insensitive)
  if (normalizedPatternWithSlash === normalizedPathnameWithSlash) {
    return { path: pattern };
  }

  return null;
}

// Sort routes by path length (longest first) to match most specific routes first
const sortedRoutes = [...routes].sort((a, b) => {
  const pathA = a.path || '';
  const pathB = b.path || '';
  return pathB.length - pathA.length;
});

/**
 * Simple implementation of matchRoutes to find matching routes
 * Better performance alternative of `import { matchRoutes } from 'react-router-dom'`
 * @param _routes - Array of routes (unused, uses pre-sorted sortedRoutes)
 * @param pathname - The pathname to match
 * @returns Array of matched routes with route object, or null if no match
 */
function matchRoutes(
  _routes: Route[],
  pathname: string,
): Array<{ route: Route }> | null {
  for (const route of sortedRoutes) {
    const routePath = route.path || '';
    const match = matchPath(routePath, pathname);

    if (match) {
      return [{ route }];
    }
  }

  return null;
}

const cache = new Map<string, Route>();
/**
 * this is a bridge of two core features Sidebar and RouteService
 * @param pathname useLocation().pathname
 * @returns
 */
export function pathnameToRouteService(pathname: string): Route | undefined {
  // Strip hash and search parameters before processing
  const normalizedPathname = normalizeRoutePath(pathname);

  // Use normalized pathname as cache key for case-insensitive caching
  const cacheItem = cache.get(normalizedPathname);
  if (cacheItem) {
    return cacheItem;
  }

  const matched = matchRoutes(routes, normalizedPathname);
  const route: Route | undefined = matched?.[0]?.route;
  if (route) {
    cache.set(normalizedPathname, route);
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
  // Strip hash and search parameters before comparing
  const linkMatched = matchPath(itemLink, currentPathname);
  return linkMatched !== null;
}

export const preloadLink = (link: string) => {
  const route = pathnameToRouteService(link);
  if (route) {
    route.preload();
  }
};
