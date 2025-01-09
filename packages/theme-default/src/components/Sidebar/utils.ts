import {
  type SidebarDivider as ISidebarDivider,
  type SidebarItem as ISidebarItem,
  type SidebarSectionHeader as ISidebarSectionHeader,
  type NormalizedSidebarGroup,
  isExternalUrl,
} from '@rspress/shared';

export const isSidebarDivider = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is ISidebarDivider => {
  return 'dividerType' in item;
};

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
