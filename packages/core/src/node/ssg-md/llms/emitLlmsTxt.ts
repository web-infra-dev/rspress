import {
  getSidebarDataGroup,
  type Nav,
  type NavItemWithLink,
  type Sidebar,
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  type UserConfig,
} from '@rspress/shared';
import { matchPath } from 'react-router-dom';
import type { RouteService } from '../../route/RouteService';
import { generateLlmsFullTxt, generateLlmsTxt } from './llmsTxt';

export async function emitLlmsTxt(
  config: UserConfig,
  routeService: RouteService,
  emitAsset: (assetName: string, content: string | Buffer) => void,
  mdContents: Map<string, string>,
) {
  const base = config.base ?? '/';
  const locales = config.themeConfig?.locales;
  const isMultiLang = locales && locales.length > 0;

  const nav = (
    isMultiLang
      ? locales
          .filter(i => Boolean(i.nav))
          .map(i => ({ nav: i.nav, lang: i.lang }))
      : [{ nav: config.themeConfig?.nav, lang: config.lang ?? '' }]
  ) as {
    nav: Nav;
    lang: string;
  }[];

  const sidebars = isMultiLang
    ? locales.map(i => i.sidebar)
    : [config.themeConfig?.sidebar];

  const sidebar = sidebars.reduce((prev: Sidebar, curr) => {
    Object.assign(prev, curr);
    return prev;
  }, {} as Sidebar);

  const noVersionNav: (NavItemWithLink & { lang: string })[] = Array.isArray(
    nav,
  )
    ? (
        nav
          .map(i => {
            const nav = ((i.nav as any).default || i.nav) as NavItemWithLink[];
            const lang = i.lang;
            return nav.map(i => {
              return {
                ...i,
                lang,
              };
            });
          })
          .flat() as unknown as (NavItemWithLink & { lang: string })[]
      ).filter(i => i.activeMatch || i.link)
    : [];

  const defaultLang = routeService.getDefaultLang();
  await Promise.all(
    routeService.getLangs().map(async lang => {
      const navList = noVersionNav.filter(i => i.lang === lang);
      const routeGroups: string[][] = new Array(navList.length)
        .fill(0)
        .map(() => []);
      const others: string[] = [];

      routeService.getRoutes().forEach(routeMeta => {
        if (routeMeta.lang !== lang) {
          return;
        }
        const { routePath } = routeMeta;

        for (let i = 0; i < routeGroups.length; i++) {
          const routeGroup = routeGroups[i];
          const navItem = navList[i];
          if (
            lang === navItem.lang &&
            new RegExp(navItem.activeMatch ?? navItem.link).test(routePath)
          ) {
            routeGroup.push(routePath);
            return;
          }
        }
        others.push(routePath);
      });

      for (const routeGroup of routeGroups) {
        organizeBySidebar(sidebar, routeGroup);
      }

      const llmsTxtContent = await generateLlmsTxt(
        routeGroups,
        others,
        navList,
        config.title,
        config.description,
        config.base!,
        routeService,
      );

      const llmsFullTxtContent = generateLlmsFullTxt(
        routeGroups,
        navList,
        others,
        base,
        mdContents,
      );

      const prefix = defaultLang === lang ? '' : `${lang}/`;

      emitAsset(`${prefix}llms.txt`, llmsTxtContent);
      emitAsset(`${prefix}llms-full.txt`, llmsFullTxtContent);
    }),
  );
}

function flatSidebar(
  sidebar: (
    | SidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader
    | string
  )[],
): string[] {
  if (!sidebar) {
    return [];
  }
  return sidebar
    .flatMap(i => {
      if (typeof i === 'string') {
        return i;
      }
      if ('link' in i && typeof i.link === 'string') {
        return [i.link, ...flatSidebar((i as any)?.items ?? [])];
      }
      if ('items' in i && Array.isArray(i.items)) {
        return flatSidebar(i.items);
      }
      return undefined;
    })
    .filter(Boolean) as string[];
}

function organizeBySidebar(sidebar: Sidebar, routes: string[]) {
  if (routes.length === 0) {
    return;
  }
  const route = routes[0];
  const currSidebar = getSidebarDataGroup(sidebar as any, route);

  if (currSidebar.length === 0) {
    return;
  }
  const orderList = flatSidebar(currSidebar);

  routes.sort((a, b) => {
    let aIndex = orderList.findIndex(order => matchPath(order, a));
    // if not in sidebar, put it to last
    if (aIndex === -1) {
      aIndex = Number.MAX_SAFE_INTEGER;
    }
    let bIndex = orderList.findIndex(order => matchPath(order, b));
    if (bIndex === -1) {
      bIndex = Number.MAX_SAFE_INTEGER;
    }
    return aIndex - bIndex;
  });
}
