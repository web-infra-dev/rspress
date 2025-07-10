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
import { base } from 'virtual-runtime-config';
import siteData from 'virtual-site-data';

export function withBase(url = '/'): string {
  return rawWithBase(url, base);
}

export function removeBase(url: string): string {
  return rawRemoveBase(url, base);
}

export function isEqualPath(a: string, b: string) {
  return (
    removeBase(normalizeHrefInRuntime(removeHash(a))) ===
    removeBase(normalizeHrefInRuntime(removeHash(b)))
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

function isAbsoluteUrl(path: string) {
  return isExternalUrl(path) || isDataUrl(path) || path.startsWith('//');
}

export { addLeadingSlash, removeTrailingSlash, normalizeSlash, isProduction };
