import {
  addLeadingSlash,
  normalizeHref,
  normalizePosixPath,
  removeTrailingSlash,
  type RouteMeta,
  type UserConfig,
  withSiteOrigin,
} from '@rspress/shared';

export interface AlternateLink {
  href: string;
  hrefLang: string;
}

export type AlternateLinksByRoute = Partial<Record<string, AlternateLink[]>>;

export function createAlternateLinksByRoute(
  routes: RouteMeta[],
  config: UserConfig,
): AlternateLinksByRoute {
  const routeGroups = new Map<string, RouteMeta[]>();

  for (const route of routes) {
    if (!route.lang) {
      continue;
    }

    const groupKey = JSON.stringify([route.version, route.pureRoutePath]);
    const routeGroup = routeGroups.get(groupKey) ?? [];
    routeGroup.push(route);
    routeGroups.set(groupKey, routeGroup);
  }

  const locales = config.locales ?? config.themeConfig?.locales ?? [];
  const localeOrder = new Map(
    locales.map(({ lang }, index) => [lang, index] as const),
  );
  const alternateLinksByRoute: AlternateLinksByRoute = {};

  for (const routeGroup of routeGroups.values()) {
    const routesByLang = new Map(routeGroup.map(route => [route.lang, route]));
    if (routesByLang.size < 2) {
      continue;
    }

    const alternateRoutes = Array.from(routesByLang.values()).sort(
      (a, b) =>
        (localeOrder.get(a.lang) ?? Number.MAX_SAFE_INTEGER) -
          (localeOrder.get(b.lang) ?? Number.MAX_SAFE_INTEGER) ||
        a.lang.localeCompare(b.lang),
    );
    const alternateLinks = alternateRoutes.map(route => ({
      href: getRouteHref(route.routePath, config),
      hrefLang: route.lang.replaceAll('_', '-'),
    }));

    for (const route of alternateRoutes) {
      alternateLinksByRoute[route.routePath] = alternateLinks;
    }
  }

  return alternateLinksByRoute;
}

function getRouteHref(routePath: string, config: UserConfig): string {
  const normalizedHref = normalizeHref(
    routePath,
    config.route?.cleanUrls ?? false,
  );
  const normalizedBase = removeTrailingSlash(
    addLeadingSlash(normalizePosixPath(config.base ?? '/')),
  );
  return withSiteOrigin(
    `${normalizedBase}${normalizedHref}`,
    config.siteOrigin,
  );
}
