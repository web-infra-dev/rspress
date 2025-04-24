import type { NavItemWithLink, NormalizedSidebar } from '../types/defaultTheme';
import { withBase, withoutBase } from './utils';
import { addTrailingSlash } from './utils';

/**
 * match the sidebar key in user config
 * @param pattern /zh/guide
 * @param currentPathname /base/zh/guide/getting-started
 */
export const matchSidebar = (
  pattern: string,
  currentPathname: string,
  base: string,
): boolean => {
  const prefix = withBase(pattern, base);
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

/**
 * get the sidebar group for the current page
 * @param sidebar const { sidebar } = useLocaleSiteData();
 * @param currentPathname
 * @returns
 */
export const getSidebarDataGroup = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
  base: string,
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
    if (matchSidebar(name, currentPathname, base)) {
      const sidebarGroup = sidebar[name];
      return sidebarGroup;
    }
  }
  return [];
};

export const matchNavbar = (
  item: NavItemWithLink,
  currentPathname: string,
  base: string,
): boolean => {
  return new RegExp(item.activeMatch || item.link).test(
    withoutBase(currentPathname, base),
  );
};
