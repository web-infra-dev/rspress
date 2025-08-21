import {
  isActive,
  pathnameToRouteService,
  useLocation,
} from '@rspress/runtime';
import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
} from '@rspress/shared';
import { useCallback } from 'react';

export const isSidebarDivider = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is ISidebarDivider => {
  return 'dividerType' in item;
};

export const isSidebarSingleFile = (
  item: ISidebarItem | NormalizedSidebarGroup,
) => !('items' in item) && 'link' in item;

export const isSidebarSectionHeader = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is ISidebarSectionHeader => {
  return 'sectionHeaderText' in item;
};

export const isSidebarGroup = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is NormalizedSidebarGroup => {
  return 'items' in item && Array.isArray(item.items);
};

export const preloadLink = (link: string) => {
  const route = pathnameToRouteService(link);
  if (route) {
    route.preload();
  }
};

export const useActiveMatcher = () => {
  const { pathname: rawPathname } = useLocation();

  const activeMatcher = useCallback(
    (link: string) => {
      const pathname = decodeURIComponent(rawPathname);
      return isActive(link, pathname);
    },
    [rawPathname],
  );

  return activeMatcher;
};
