import type { NormalizedSidebarGroup, SidebarItem } from '@rspress/shared';
import { useLocation, withBase, isEqualPath } from '@rspress/runtime';
import { useSidebarData } from './useSidebarData';

export function usePrevNextPage() {
  const { pathname } = useLocation();
  const { items } = useSidebarData();
  const flattenTitles: SidebarItem[] = [];

  const walk = (sidebarItem: NormalizedSidebarGroup | SidebarItem) => {
    if ('items' in sidebarItem) {
      if (sidebarItem.link) {
        flattenTitles.push({
          text: sidebarItem.text,
          link: sidebarItem.link,
        });
      }
      sidebarItem.items.forEach(item => {
        !('dividerType' in item) && walk(item);
      });
    } else {
      flattenTitles.push(sidebarItem);
    }
  };

  items.forEach(item => !('dividerType' in item) && walk(item));

  const pageIndex = flattenTitles.findIndex(item =>
    isEqualPath(withBase(item.link), pathname),
  );

  const prevPage = flattenTitles[pageIndex - 1] || null;
  const nextPage = flattenTitles[pageIndex + 1] || null;

  return {
    prevPage,
    nextPage,
  };
}
