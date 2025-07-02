import { join } from 'node:path';
import type { NavItem, NavItemWithLink } from '@rspress/shared';
import { normalizeLink } from '../../mdx/remarkPlugins/normalizeLink';
import type { RouteService } from '../../route/RouteService';

export const normalizeNav = (
  nav: NavItem[],
  currentLang: string,
  routeService: RouteService,
  userDocRoot: string,
  cleanUrls: boolean,
): NavItem[] => {
  if (!nav) {
    return [];
  }
  // @ts-ignore
  if (nav.default) {
    // @ts-ignore
    nav = nav.default;
  }
  const transformNavItem = (navItem: NavItem): NavItem => {
    const text = navItem.text;
    if ('link' in navItem) {
      return {
        ...navItem,
        link: normalizeLink(
          navItem.link,
          routeService,
          join(userDocRoot, currentLang),
          cleanUrls,
        ),
      };
    }

    if ('items' in navItem && Array.isArray(navItem.items)) {
      return {
        ...navItem,
        text,
        items: navItem.items.map((item: NavItemWithLink) => {
          return {
            ...item,
            link: normalizeLink(
              item.link,
              routeService,
              join(userDocRoot, currentLang),
              cleanUrls,
            ),
          };
        }),
      };
    }

    return navItem;
  };

  return nav.map(transformNavItem);
};
