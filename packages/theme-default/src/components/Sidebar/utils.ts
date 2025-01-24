import { matchRoutes } from '@rspress/runtime';
import {
  type SidebarDivider as ISidebarDivider,
  type SidebarItem as ISidebarItem,
  type SidebarSectionHeader as ISidebarSectionHeader,
  type NormalizedSidebarGroup,
  isExternalUrl,
} from '@rspress/shared';
import { routes } from 'virtual-routes';

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
  const match = matchRoutes(routes, link);
  if (match?.length) {
    const { route } = match[0];
    route.preload();
  }
};
