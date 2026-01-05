import {
  addLeadingSlash,
  isDataUrl,
  isExternalUrl,
  isProduction,
  normalizeHref,
  removeBase as rawRemoveBase,
  withBase as rawWithBase,
  removeHash,
  removeTrailingSlash,
} from '@rspress/shared';
import siteData from 'virtual-site-data';

function withBase(url = '/'): string {
  return rawWithBase(url, siteData.base);
}

function removeBase(url: string): string {
  return rawRemoveBase(url, siteData.base);
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

function isAbsoluteUrl(path: string) {
  return isExternalUrl(path) || isDataUrl(path) || path.startsWith('//');
}

export {
  addLeadingSlash,
  removeTrailingSlash,
  isProduction,
  normalizeImagePath,
  cleanUrlByConfig,
  removeBase,
  withBase,
  isEqualPath,
  normalizeHrefInRuntime,
};
