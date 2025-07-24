import { pathnameToRouteService, useLocation } from '@rspress/runtime';
import {
  type SidebarDivider as ISidebarDivider,
  type SidebarItem as ISidebarItem,
  type SidebarSectionHeader as ISidebarSectionHeader,
  isExternalUrl,
  type NormalizedSidebarGroup,
} from '@rspress/shared';
import { useCallback } from 'react';
import { isActive } from '../../logic/getSidebarDataGroup';

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

export const isSideBarCustomLink = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
) => {
  return 'link' in item && isExternalUrl(item.link);
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
