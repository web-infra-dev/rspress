import {
  addLeadingSlash,
  isDataUrl,
  isExternalUrl,
  isProduction,
  normalizeHref,
  normalizeSlash,
  removeBase as rawRemoveBase,
  withBase as rawWithBase,
  removeHash,
  removeTrailingSlash,
} from '@rspress/shared';
import siteData from 'virtual-site-data';

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
