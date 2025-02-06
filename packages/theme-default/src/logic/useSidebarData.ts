import { isEqualPath, useLocation, withBase } from '@rspress/runtime';
import {
  type NormalizedSidebar,
  type NormalizedSidebarGroup,
  type SidebarDivider,
  type SidebarItem,
  addTrailingSlash,
} from '@rspress/shared';
import { useMemo } from 'react';
import { useLocaleSiteData } from './useLocaleSiteData';

interface SidebarData {
  // The group name for the sidebar
  group: string;
  items: (NormalizedSidebarGroup | SidebarItem | SidebarDivider)[];
}

/**
 * @param pattern /zh/guide
 * @param currentPathname /base/zh/guide/getting-started
 */
export const matchPath = (
  pattern: string,
  currentPathname: string,
): boolean => {
  const prefix = withBase(pattern);
  if (prefix === currentPathname) {
    return true;
  }
  const prefixWithTrailingSlash = addTrailingSlash(prefix);
  return currentPathname.startsWith(prefixWithTrailingSlash);
};

const match = (
  item: NormalizedSidebarGroup | SidebarItem | SidebarDivider,
  currentPathname: string,
): NormalizedSidebarGroup | SidebarItem | undefined => {
  const isLink = 'link' in item && item.link !== '';
  const isDir = 'items' in item;

  // 0. divider or section headers others return false

  // 1. file link
  if (!isDir && isLink) {
    // 1.1 /api/config /api/config.html
    if (isEqualPath(withBase(item.link), currentPathname)) {
      return item;
    }
    // 1.2 /api/config/index /api/config/index.html
    if (
      currentPathname.includes('index') &&
      isEqualPath(`${item.link}/index`, currentPathname)
    ) {
      return item;
    }
  }

  // 2. dir
  if (isDir) {
    // 2.1 dir link (index convention)
    if (
      isLink &&
      (isEqualPath(withBase(item.link), currentPathname) ||
        isEqualPath(withBase(`${item.link}/index`), currentPathname))
    ) {
      return item;
    }
    // 2.2 dir recursive
    for (const childItem of item.items) {
      const matched = match(childItem, currentPathname);
      if (matched) {
        return matched;
      }
    }
  }

  return undefined;
};

export const getSidebarGroupData = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
) => {
  console.log(sidebar, 111111);
  for (const name of Object.keys(sidebar)) {
    const isMatch = matchPath(name, currentPathname);
    console.log(isMatch, name, currentPathname);
    if (isMatch) {
      const sidebarGroup = sidebar[name];
      const group = sidebarGroup.find(item => match(item, currentPathname));
      return {
        group: group && 'text' in group ? group.text : '',
        items: sidebarGroup,
      };
    }
  }
  return {
    group: 'Documentation',
    items: [],
  };
};
export function useSidebarData(): SidebarData {
  const { sidebar } = useLocaleSiteData();
  const { pathname: rawPathname } = useLocation();
  const pathname = decodeURIComponent(rawPathname);

  const sidebarData = useMemo(() => {
    return getSidebarGroupData(sidebar, pathname);
  }, [sidebar, pathname]);

  return sidebarData;
}
