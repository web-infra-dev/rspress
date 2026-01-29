import {
  matchSidebar,
  type NormalizedSidebar,
  type NormalizedSidebarGroup,
  type SidebarData,
  type SidebarDivider,
  type SidebarItem,
  type SidebarSectionHeader,
} from '@rspress/shared';
import React, { useLayoutEffect, useMemo, useState } from 'react';
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
  const { sidebar } = useLocaleSiteData();
  const activeMatcher = useActiveMatcher();
  const isAccordionMode = sidebar?.accordion === true;

  const [sidebarState, setSidebarState] = useState<SidebarData>(() =>
    createInitialSidebar(
      // do not modify singleton global sidebar on server - #2910
      structuredClone(rawSidebarData),
      activeMatcher,
    ),
  );

  useLayoutEffect(() => {
    setSidebarState(createInitialSidebar(rawSidebarData, activeMatcher));
  }, [activeMatcher, rawSidebarData]);

  // Wrap setSidebarState to implement accordion behavior
  const setSidebar = React.useCallback<React.Dispatch<React.SetStateAction<SidebarData>>>(
    (action) => {
      setSidebarState((prevSidebar) => {
        const newSidebar = typeof action === 'function' ? action(prevSidebar) : action;
        
        // If accordion mode is enabled, ensure only one top-level section is expanded
        if (isAccordionMode) {
          // Find which top-level item was just toggled to expanded
          let expandedIndex = -1;
          for (let i = 0; i < newSidebar.length; i++) {
            const item = newSidebar[i];
            const prevItem = prevSidebar[i];
            if (
              'collapsed' in item &&
              'collapsed' in prevItem &&
              item.collapsed === false &&
              prevItem.collapsed === true
            ) {
              expandedIndex = i;
              break;
            }
          }
          
          // If we found a newly expanded item, collapse all others at the same level
          if (expandedIndex !== -1) {
            return newSidebar.map((item, index) => {
              if (index !== expandedIndex && 'collapsed' in item) {
                return { ...item, collapsed: true };
              }
              return item;
            });
          }
        }
        
        return newSidebar;
      });
    },
    [isAccordionMode]
  );

  return [sidebarState, setSidebar];
}
