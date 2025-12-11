import {
  matchSidebar,
  type NormalizedSidebar,
  type NormalizedSidebarGroup,
  type SidebarData,
  type SidebarDivider,
  type SidebarItem,
  type SidebarSectionHeader,
} from '@rspress/shared';
import { useLayoutEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useActiveMatcher } from './useActiveMatcher';
import { useLocaleSiteData } from './useLocaleSiteData';

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

function createInitialSidebar(
  rawSidebarData: SidebarData,
  activeMatcher: (link: string) => boolean,
) {
  const matchCache = new WeakMap<
    | NormalizedSidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader,
    boolean
  >();
  const match = (
    item:
      | NormalizedSidebarGroup
      | SidebarItem
      | SidebarDivider
      | SidebarSectionHeader,
  ) => {
    if (matchCache.has(item)) {
      return matchCache.get(item);
    }
    if ('link' in item && item.link && activeMatcher(item.link)) {
      matchCache.set(item, true);
      return true;
    }
    if ('items' in item) {
      const result = item.items.some(child => match(child));
      if (result) {
        matchCache.set(item, true);
        return true;
      }
    }
    matchCache.set(item, false);
    return false;
  };
  const traverse = (
    item:
      | NormalizedSidebarGroup
      | SidebarItem
      | SidebarDivider
      | SidebarSectionHeader,
  ) => {
    if ('items' in item) {
      item.items.forEach(traverse);
      if (match(item)) {
        item.collapsed = false;
      }
    }
  };
  const newSidebarData = rawSidebarData.filter(Boolean).flat();
  newSidebarData.forEach(traverse);
  return newSidebarData;
}

/**
 * handle the collapsed state of the sidebar groups
 */
export function useSidebarDynamic(): [
  SidebarData,
  React.Dispatch<React.SetStateAction<SidebarData>>,
] {
  const rawSidebarData = useSidebar();
  const activeMatcher = useActiveMatcher();

  const [sidebar, setSidebar] = useState<SidebarData>(() =>
    createInitialSidebar(rawSidebarData, activeMatcher),
  );

  useLayoutEffect(() => {
    setSidebar(createInitialSidebar(rawSidebarData, activeMatcher));
  }, [rawSidebarData]);

  return [sidebar, setSidebar];
}
