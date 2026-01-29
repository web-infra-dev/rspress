import {
  getSidebarDataGroup,
  type NavItem,
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

  const defaultLang = routeService.getDefaultLang();
  const langs = [...new Set([defaultLang, ...routeService.getLangs()])];
  const defaultVersion = routeService.getDefaultVersion();
  const versions = routeService.getVersions();
  const isMultiVersion = versions.length > 0;

  // Collect raw nav configs per lang
  const rawNavConfigs = isMultiLang
    ? locales
        .filter(i => Boolean(i.nav))
        .map(i => ({ nav: i.nav!, lang: i.lang }))
    : config.themeConfig?.nav
      ? [{ nav: config.themeConfig.nav, lang: config.lang ?? '' }]
      : [];

  // Collect sidebars
  const sidebars = isMultiLang
    ? locales.map(i => i.sidebar)
    : [config.themeConfig?.sidebar];

  const sidebar = sidebars.reduce((prev: Sidebar, curr) => {
    Object.assign(prev, curr);
    return prev;
  }, {} as Sidebar);

  // Resolve nav for a specific version
  function resolveNavForVersion(
    version: string,
  ): (NavItemWithLink & { lang: string })[] {
    return rawNavConfigs
      .flatMap(({ nav, lang }) => {
        let navArray: NavItem[];
        if (Array.isArray(nav)) {
          navArray = nav;
        } else {
          // nav is { [version]: NavItem[] }
          navArray = nav[version] ?? nav[defaultVersion] ?? [];
        }
        return navArray.map(
          item => ({ ...item, lang }) as NavItemWithLink & { lang: string },
        );
      })
      .filter(i => i.activeMatch || i.link);
  }

  // Generate llms files for a specific lang+version combination
  async function generateForLangVersion(lang: string, version: string) {
    const navList = resolveNavForVersion(version).filter(i => i.lang === lang);
    const routeGroups: string[][] = new Array(navList.length)
      .fill(0)
      .map(() => []);
    const others: string[] = [];

    routeService.getRoutes().forEach(routeMeta => {
      if (routeMeta.lang !== lang) {
        return;
      }
      if (isMultiVersion && routeMeta.version !== version) {
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

    const langPrefix = defaultLang === lang ? '' : `${lang}/`;
    const versionPrefix =
      isMultiVersion && version !== defaultVersion ? `${version}/` : '';
    const prefix = `${versionPrefix}${langPrefix}`;

    emitAsset(`${prefix}llms.txt`, llmsTxtContent);
    emitAsset(`${prefix}llms-full.txt`, llmsFullTxtContent);
  }

  const versionList = isMultiVersion ? versions : [''];
  await Promise.all(
    versionList.flatMap(version =>
      langs.map(lang => generateForLangVersion(lang, version)),
    ),
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
