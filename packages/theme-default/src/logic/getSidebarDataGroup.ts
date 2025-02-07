import { isEqualPath, withBase } from '@rspress/runtime';
import {
  type NormalizedSidebar,
  type NormalizedSidebarGroup,
  type SidebarDivider,
  type SidebarItem,
  addTrailingSlash,
} from '@rspress/shared';
import type { SidebarData } from '../components';

export interface SidebarDataGroup {
  // The group name for the sidebar
  group: string;
  items: SidebarData;
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

export const getSidebarDataGroup = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
): SidebarDataGroup => {
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
  const navRoutes = Object.keys(sidebar).sort((a, b) => b.length - a.length);
  for (const name of navRoutes) {
    if (matchPath(name, currentPathname)) {
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
