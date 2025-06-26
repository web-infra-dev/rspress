import type {
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
} from '@rspress/shared';
import { isSidebarDivider } from '../Sidebar/utils';

function removeIndex(link: string) {
  if (link.endsWith('/index')) {
    return link.slice(0, -5);
  }
  return link;
}

/**
 * @zh_CN 如果 index 在 sidebar items 中, 则返回所有平级 item, 如果 index 在 dir 上, 则返回 items
 * @example
 */
export function findItemByRoutePath(
  items: (SidebarItem | NormalizedSidebarGroup | SidebarDivider)[],
  routePath: string,
): (SidebarItem | NormalizedSidebarGroup)[] {
  function isRoutePathMatch(
    item: SidebarItem | NormalizedSidebarGroup | SidebarDivider,
  ) {
    if (isSidebarDivider(item)) {
      return false;
    }
    const removeIndexUrl = removeIndex(item.link || '/');
    const removeBackSlashedRoutePath = routePath.replace(/\/$/, '');
    return (
      removeIndexUrl === routePath ||
      removeIndexUrl === removeBackSlashedRoutePath
    );
  }

  const matchRoutePathItemIndex = items.findIndex(item => {
    return isRoutePathMatch(item);
  });

  if (matchRoutePathItemIndex === -1) {
    return items
      .map(item => {
        if (!('items' in item)) {
          return [];
        }
        return findItemByRoutePath(item.items, routePath);
      })
      .flat();
  }

  const matchRoutePathItem = items[matchRoutePathItemIndex] as
    | SidebarItem
    | NormalizedSidebarGroup;

  const isArray = (i: unknown): i is Array<unknown> =>
    Array.isArray(i) && i.length >= 1;

  // 1. if isDir(item) return item.items
  if ('items' in matchRoutePathItem && isArray(matchRoutePathItem.items)) {
    // 2. if isDir(item) && item.items is all files, style is different
    if (matchRoutePathItem.items.every(item => !('items' in item))) {
      return [matchRoutePathItem];
    }

    return matchRoutePathItem.items.filter(item => !isSidebarDivider(item)) as (
      | SidebarItem
      | NormalizedSidebarGroup
    )[];
  }

  // 3. if matchRoutePathItem is a item, return other items in same level (/api/index.md is in the child sidebar)
  const result = [...items];
  if (!('items' in matchRoutePathItem)) {
    result.splice(matchRoutePathItemIndex, 1);
  }
  const res = result.filter(item => !isSidebarDivider(item)) as (
    | SidebarItem
    | NormalizedSidebarGroup
  )[];

  return res;
}
