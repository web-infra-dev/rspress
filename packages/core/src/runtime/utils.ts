import siteData from 'virtual-site-data';
import {
  addLeadingSlash,
  removeTrailingSlash,
  normalizeSlash,
  isProduction,
  normalizeHref,
  withBase as rawWithBase,
  removeBase as rawRemoveBase,
  isExternalUrl,
} from '@rspress/shared';

export function normalizeRoutePath(routePath: string) {
  return decodeURIComponent(routePath)
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');
}

export function withBase(url = '/'): string {
  return rawWithBase(url, siteData.base);
}

export function removeBase(url: string): string {
  return rawRemoveBase(url, siteData.base);
}

export function isEqualPath(a: string, b: string) {
  return (
    withBase(normalizeHrefInRuntime(a)) === withBase(normalizeHrefInRuntime(b))
  );
}

export function normalizeHrefInRuntime(a: string) {
  const cleanUrls = Boolean(siteData?.route?.cleanUrls);
  return normalizeHref(a, cleanUrls);
}

export function normalizeImagePath(imagePath: string) {
  if (isExternalUrl(imagePath)) {
    return imagePath;
  }

  return withBase(imagePath);
}

export { addLeadingSlash, removeTrailingSlash, normalizeSlash, isProduction };
