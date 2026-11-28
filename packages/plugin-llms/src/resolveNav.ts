import type { Nav, NavItem } from '@rspress/core';

/**
 * Flatten the per-language nav configs of one version into a flat list
 * with the language attached. Dropdown groups (no `link`) are kept:
 * matchNavItem buckets their pages through the children's links.
 */
export function resolveNavForVersion(
  nav: { nav: Nav; lang: string }[],
  version: string,
  defaultVersion: string,
): (NavItem & { lang: string })[] {
  return nav
    .flatMap(({ nav, lang }) => {
      let navArray: NavItem[];
      if (Array.isArray(nav)) {
        navArray = nav;
      } else {
        // nav is { [version]: NavItem[] } or { default: NavItem[] }
        const navObj = nav as Record<string, NavItem[]>;
        navArray =
          navObj[version] ?? navObj[defaultVersion] ?? navObj.default ?? [];
      }
      return navArray.map(
        item =>
          ({ ...item, lang }) as NavItem & {
            lang: string;
          },
      );
    })
    .filter(
      i =>
        ('activeMatch' in i && i.activeMatch) ||
        ('link' in i && i.link) ||
        ('items' in i && i.items.length > 0),
    );
}
