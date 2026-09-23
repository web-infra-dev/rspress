import type { SiteData } from '@rspress/shared';
import virtualSiteData from 'virtual-site-data';

let siteData: SiteData = virtualSiteData;
const listeners = new Set<() => void>();

const getSiteData = () => siteData;

const subscribeSiteData = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-site-data', () => {
    siteData = virtualSiteData;
    for (const listener of listeners) {
      listener();
    }
  });
}

export { getSiteData, siteData, subscribeSiteData };
