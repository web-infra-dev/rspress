import type { SiteData } from '@rspress/shared';
import siteData from 'virtual-site-data';

export function useSite(): { site: SiteData } {
  return { site: siteData };
}
