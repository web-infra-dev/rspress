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
  isDataUrl,
  removeHash,
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
    withBase(normalizeHrefInRuntime(removeHash(a))) ===
    withBase(normalizeHrefInRuntime(removeHash(b)))
  );
}

export function normalizeHrefInRuntime(a: string) {
  const cleanUrls = Boolean(siteData?.route?.cleanUrls);
  return normalizeHref(a, cleanUrls);
}

export function normalizeImagePath(imagePath: string) {
  const isProd = isProduction();
  if (!isProd) {
    return imagePath;
  }
  if (isAbsoluteUrl(imagePath)) {
    return imagePath;
  }
  // only append base to internal non-relative urls
  if (!imagePath.startsWith('/')) {
    return imagePath;
  }

  return withBase(imagePath);
}

export function isAbsoluteUrl(path: string) {
  return isExternalUrl(path) || isDataUrl(path) || path.startsWith('//');
}

export { addLeadingSlash, removeTrailingSlash, normalizeSlash, isProduction };
