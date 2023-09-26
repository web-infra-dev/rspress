import siteData from 'virtual-site-data';
import {
  addLeadingSlash,
  removeTrailingSlash,
  normalizeSlash,
  isProduction,
  normalizeHref,
  withBase as rawWithBase,
  removeBase as rawRemoveBase,
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

export function isEqualPath(a: string, b: string, cleanUrls: boolean) {
  return withBase(normalizeHref(a, cleanUrls)) === withBase(normalizeHref(b, cleanUrls));
}

export function useNormalizeHrefInRuntime(a: string){
  const cleanUrls = Boolean(siteData?.route?.cleanUrls);
  return normalizeHref(a, cleanUrls);
}

export {
  addLeadingSlash,
  removeTrailingSlash,
  normalizeSlash,
  isProduction,
};
