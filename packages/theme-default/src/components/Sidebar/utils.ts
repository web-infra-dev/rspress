import {
  isExternalUrl,
  type NormalizedSidebarGroup,
  type SidebarItem as ISidebarItem,
  type SidebarDivider as ISidebarDivider,
  type SidebarSectionHeader as ISidebarSectionHeader,
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
