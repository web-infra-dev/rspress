import {
  normalizeHref,
  type RouteMeta,
  type UserConfig,
  withBase,
  withSiteOrigin,
} from '@rspress/shared';

export interface AlternateLink {
  href: string;
  hrefLang: string;
}

export type AlternateLinksByRoute = Record<string, AlternateLink[]>;

export function createAlternateLinks(
  routes: RouteMeta[],
  config: UserConfig,
): AlternateLinksByRoute {
  const routeGroups = new Map<string, RouteMeta[]>();

  for (const route of routes) {
    if (!route.lang) {
      continue;
    }

    const pureRoutePath = removeRoutePrefixes(route);
    const groupKey = `${route.version}\0${pureRoutePath}`;
    const group = routeGroups.get(groupKey) ?? [];
    group.push(route);
    routeGroups.set(groupKey, group);
  }

  const locales = config.locales ?? config.themeConfig?.locales ?? [];
  const localeOrder = new Map(
    locales.map(({ lang }, index) => [lang, index] as const),
  );
  const linksByRoute: AlternateLinksByRoute = {};

  for (const routes of routeGroups.values()) {
    const routesByLang = new Map(routes.map(route => [route.lang, route]));
    if (routesByLang.size < 2) {
      continue;
    }

    const alternateRoutes = Array.from(routesByLang.values()).sort(
      (a, b) =>
        (localeOrder.get(a.lang) ?? Number.MAX_SAFE_INTEGER) -
          (localeOrder.get(b.lang) ?? Number.MAX_SAFE_INTEGER) ||
        a.lang.localeCompare(b.lang),
    );
    const links = alternateRoutes.map(route => ({
      href: getRouteHref(route.routePath, config),
      hrefLang: route.lang,
    }));

    for (const route of alternateRoutes) {
      linksByRoute[route.routePath] = links;
    }
  }

  return linksByRoute;
}

function removeRoutePrefixes(route: RouteMeta): string {
  const hasTrailingSlash = route.routePath.endsWith('/');
  const parts = route.routePath.split('/').filter(Boolean);

  if (route.version && parts[0] === route.version) {
    parts.shift();
  }
  if (route.lang && parts[0] === route.lang) {
    parts.shift();
  }

  const pureRoutePath = `/${parts.join('/')}`;
  return hasTrailingSlash && pureRoutePath !== '/'
    ? `${pureRoutePath}/`
    : pureRoutePath;
}

function getRouteHref(routePath: string, config: UserConfig): string {
  const normalizedHref = normalizeHref(
    routePath,
    config.route?.cleanUrls ?? false,
  );
  return withSiteOrigin(
    withBase(normalizedHref, config.base ?? '/'),
    config.siteOrigin,
  );
}
