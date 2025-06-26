import { isEqualPath, useLocation } from '@rspress/runtime';
import type {
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/shared';
import { useSidebarData } from './useSidebarData';

export function usePrevNextPage(): {
  prevPage: SidebarItem | null;
  nextPage: SidebarItem | null;
} {
  const { pathname } = useLocation();
  const items = useSidebarData();
  const flattenTitles: SidebarItem[] = [];

  const walk = (
    sidebarItem:
      | SidebarItem
      | NormalizedSidebarGroup
      | SidebarDivider
      | SidebarSectionHeader,
  ) => {
    if ('items' in sidebarItem) {
      if (sidebarItem.link) {
        flattenTitles.push({
          text: sidebarItem.text,
          link: sidebarItem.link,
        });
      }
      sidebarItem.items.forEach(item => {
        !('dividerType' in item || 'sectionHeaderText' in item) && walk(item);
      });
    } else if ('link' in sidebarItem && sidebarItem.link) {
      flattenTitles.push(sidebarItem);
    }
  };

  items.forEach(item => walk(item));

  const pageIndex = flattenTitles.findIndex(item =>
    isEqualPath(item.link, pathname),
  );

  const prevPage = flattenTitles[pageIndex - 1] || null;
  const nextPage = flattenTitles[pageIndex + 1] || null;

  return {
    prevPage,
    nextPage,
  };
}
