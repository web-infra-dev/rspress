import { logger } from '../logger';
import type { NavItemWithLink, NormalizedSidebar } from '../types';
import { isPathPrefix, matchNavPath, stripRouteVersionPrefix } from './path';
import { normalizeHref } from './utils';

const warnedActiveMatches = new Set<string>();

/**
 * match the sidebar key in user config
 * @param pattern /zh/guide
 * @param currentPathname /base/zh/guide/getting-started
 */
export const matchSidebar = (
  pattern: string,
  currentPathname: string,
): boolean => {
  if (pattern === currentPathname) {
    return true;
  }

  if (isPathPrefix(currentPathname, pattern)) {
    return true;
  }

  // be compatible with api-extractor
  // '/api/react': [
  //   { link: '/api/react.use' }
  // ]
  const prefixWithDot = `${pattern}.`;
  return currentPathname.startsWith(prefixWithDot);
};

/**
 * get the sidebar group for the current page
 * @param sidebar const { sidebar } = useLocaleSiteData();
 * @param currentPathname
 * @returns
 */
export const getSidebarDataGroup = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
): NormalizedSidebar[string] => {
  /**
   * why sort?
   * {
   *  '/': [],
   *  '/guide': [
   *    {
   *      text: 'Getting Started',
   *      link: '/guide/getting-started',
   *    }
   *   ],
   * }
   */
  const navRoutes = Object.keys(sidebar).sort((a, b) => b.length - a.length);
  for (const name of navRoutes) {
    if (matchSidebar(name, currentPathname)) {
      const sidebarGroup = sidebar[name];
      return sidebarGroup;
    }
  }
  return [];
};

export const matchNavbar = (
  item: NavItemWithLink,
  currentPathname: string,
  versions?: string[],
): boolean => {
  if (item.activeMatch) {
    try {
      return new RegExp(item.activeMatch).test(currentPathname);
    } catch {
      // An invalid `activeMatch` regex must not break rendering — fall
      // through to the default link matching below (warn once per pattern
      // so a config typo is not silently swallowed).
      if (!warnedActiveMatches.has(item.activeMatch)) {
        warnedActiveMatches.add(item.activeMatch);
        logger.warn(`Invalid activeMatch regex: ${item.activeMatch}`);
      }
    }
  }
  // multiVersion: pages of non-default versions carry a /{version}/
  // prefix while version-agnostic nav links carry none.
  const pathname = versions?.length
    ? stripRouteVersionPrefix(currentPathname, versions)
    : currentPathname;
  return matchNavPath(pathname, normalizeHref(item.link, true));
};
