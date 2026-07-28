import {
  addLeadingSlash,
  addTrailingSlash,
  isDataUrl,
  isExternalUrl,
  isProduction,
  normalizeHref,
  removeBase as rawRemoveBase,
  withBase as rawWithBase,
  withSiteOrigin as rawWithSiteOrigin,
  removeHash,
  removeTrailingSlash,
} from '@rspress/shared';
import siteData from 'virtual-site-data';

function withBase(url = '/'): string {
  return rawWithBase(url, siteData.base);
}

function withSiteOrigin(url: string): string {
  return rawWithSiteOrigin(url, siteData.siteOrigin);
}

function removeBase(url: string): string {
  return rawRemoveBase(url, siteData.base);
}

/**
 * Redirects a base pathname without a trailing slash to its canonical URL.
 *
 * Some hosting providers may serve the homepage HTML when a site configured
 * with `base: '/docs/'` is accessed at `/docs`, leaving the browser on the
 * pathname without a trailing slash. This client-side fallback updates the URL
 * to `/docs/` with the History API, without reloading the page, while preserving
 * the query string, hash, and history state.
 *
 * @returns Whether the URL was updated.
 */
function redirectToBaseWithTrailingSlash(
  location: Pick<Location, 'hash' | 'pathname' | 'search'>,
  history: Pick<History, 'replaceState' | 'state'>,
): boolean {
  const { base } = siteData;
  const canonicalBase = addTrailingSlash(base);
  if (
    canonicalBase === '/' ||
    location.pathname !== removeTrailingSlash(canonicalBase)
  ) {
    return false;
  }

  history.replaceState(
    history.state,
    '',
    `${canonicalBase}${location.search}${location.hash}`,
  );
  return true;
}

function isEqualPath(a: string, b: string) {
  return (
    removeBase(normalizeHref(removeHash(a), true)) ===
    removeBase(normalizeHref(removeHash(b), true))
  );
}

function normalizeHrefInRuntime(link: string) {
  const cleanUrls = Boolean(siteData?.route?.cleanUrls);
  return normalizeHref(link, cleanUrls);
}

/**
 * we do cleanUrls in runtime side
 */
function cleanUrlByConfig(link: string) {
  if (siteData?.route?.cleanUrls) {
    return normalizeHref(link, true);
  }
  return link;
}

function normalizeImagePath(imagePath: string) {
  if (isAbsoluteUrl(imagePath)) {
    return imagePath;
  }
  // only append base to internal non-relative urls
  if (!imagePath.startsWith('/')) {
    return imagePath;
  }

  return withBase(imagePath);
}

function routePathToMdPath(routePath: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html(?=#|\?|$)/, '.md');
  return withBase(url);
}

function isAbsoluteUrl(path: string) {
  return isExternalUrl(path) || isDataUrl(path) || path.startsWith('//');
}

export {
  addLeadingSlash,
  addTrailingSlash,
  cleanUrlByConfig,
  isEqualPath,
  isProduction,
  normalizeHrefInRuntime,
  normalizeImagePath,
  removeBase,
  removeTrailingSlash,
  redirectToBaseWithTrailingSlash,
  routePathToMdPath,
  withBase,
  withSiteOrigin,
};
