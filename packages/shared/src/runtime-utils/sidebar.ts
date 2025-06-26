import type { NavItemWithLink, NormalizedSidebar } from '../types/defaultTheme';

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
): boolean => {
  return new RegExp(item.activeMatch || item.link).test(currentPathname);
};
