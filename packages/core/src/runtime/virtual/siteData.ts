import type { SiteData } from '@rspress/shared';
import virtualSiteData from 'virtual-site-data';
import { createVirtualStore } from './createVirtualStore';

export let siteData: SiteData = virtualSiteData;
const store = createVirtualStore(siteData);

export function useSite(): { site: SiteData } {
  return { site: store.useValue() };
}

if (import.meta.webpackHot) {
  import.meta.webpackHot.accept('virtual-site-data', () => {
    siteData = virtualSiteData;
    store.update(siteData);
  });
}
