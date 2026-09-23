import type { SiteData } from '@rspress/shared';
import { useSyncExternalStore } from 'react';
import { getSiteData, subscribeSiteData } from '../siteData';

export function useSite(): { site: SiteData } {
  const site = useSyncExternalStore(
    subscribeSiteData,
    getSiteData,
    getSiteData,
  );
  return { site };
}
