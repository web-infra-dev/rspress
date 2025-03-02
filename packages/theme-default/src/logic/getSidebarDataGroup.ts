import {
  matchPath as ReactRouterDomMatchPath,
  normalizeRoutePath,
  withBase,
} from '@rspress/runtime';
import {
  type NormalizedSidebar,
  type NormalizedSidebarGroup,
  type SidebarDivider,
  type SidebarItem,
  addTrailingSlash,
} from '@rspress/shared';
import type { SidebarData } from '../components/Sidebar';

/**
 * match the sidebar key in user config
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
  if (currentPathname.startsWith(prefixWithTrailingSlash)) {
    return true;
  }

  // be compatible with api-extractor
  // '/api/react': [
  //   { link: '/api/react.use' }
  // ]
  const prefixWithDot = `${prefix}.`;
  return currentPathname.startsWith(prefixWithDot);
};

/**
 * link: /api/config
 * currentPathname:
 *  0. /api/config
 *  1. /api/config.html
 *  2. /api/config/
 *  3. /api/config/index
 *  4. /api/config/index.html
 * @param itemLink
 * @param currentPathname
 * @returns
 */
export function isActive(itemLink: string, currentPathname: string): boolean {
  const normalizedItemLink = normalizeRoutePath(withBase(itemLink));
  const normalizedCurrentPathname = normalizeRoutePath(currentPathname);
  const linkMatched = ReactRouterDomMatchPath(
    normalizedItemLink,
    normalizedCurrentPathname,
  );
  return linkMatched !== null;
}

/**
 * get active menuItem of currentPathname
 * @param item
 * @param currentPathname
 * @returns
 */
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
    // 1.2 /api/config/index /api/config/index.html
    if (isActive(item.link, currentPathname)) {
      return item;
    }
  }

  // 2. dir
  if (isDir) {
    // 2.1 dir link (index convention)
    if (isLink && isActive(item.link!, currentPathname)) {
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

/**
 * get the sidebar group for the current page
 * @param sidebar const { sidebar } = useLocaleSiteData();
 * @param currentPathname
 * @returns
 */
export const getSidebarDataGroup = (
  sidebar: NormalizedSidebar,
  currentPathname: string,
): SidebarData => {
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
      return sidebarGroup;
    }
  }
  return [];
};
