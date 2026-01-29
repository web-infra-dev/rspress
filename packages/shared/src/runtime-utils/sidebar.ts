import type { NavItemWithLink, NormalizedSidebar, SidebarData } from '../types';
import { normalizeHref } from './utils';

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

  if (currentPathname.startsWith(pattern)) {
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
): SidebarData => {
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
  const navRoutes = Object.keys(sidebar)
    .filter(key => key !== 'accordion')
    .sort((a, b) => b.length - a.length);
  for (const name of navRoutes) {
    if (matchSidebar(name, currentPathname)) {
      const sidebarGroup = sidebar[name];
      if (Array.isArray(sidebarGroup)) {
        return sidebarGroup;
      }
    }
  }
  return [];
};

export const matchNavbar = (
  item: NavItemWithLink,
  currentPathname: string,
): boolean => {
  return new RegExp(item.activeMatch || normalizeHref(item.link, true)).test(
    currentPathname,
  );
};
