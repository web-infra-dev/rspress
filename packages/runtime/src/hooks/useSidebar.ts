import { useLocaleSiteData, useLocation } from '@rspress/runtime';
import {
  matchSidebar,
  type NormalizedSidebar,
  type SidebarData,
} from '@rspress/shared';
import { useMemo } from 'react';

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
  const navRoutes = Object.keys(sidebar).sort((a, b) => b.length - a.length);
  for (const name of navRoutes) {
    if (matchSidebar(name, currentPathname)) {
      const sidebarGroup = sidebar[name];
      return sidebarGroup;
    }
  }
  return [];
};

export function useSidebar(): SidebarData {
  const { sidebar } = useLocaleSiteData();
  const { pathname: rawPathname } = useLocation();
  const pathname = decodeURIComponent(rawPathname);

  const sidebarData: SidebarData = useMemo(() => {
    return getSidebarDataGroup(sidebar, pathname);
  }, [sidebar, pathname]);

  return sidebarData;
}
