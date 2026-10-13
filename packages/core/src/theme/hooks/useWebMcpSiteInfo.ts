import {
  useNav,
  usePage,
  useSidebar,
  useSite,
  useWebMcp,
} from '@rspress/core/runtime';
import { defineTool } from '../webMcp/tools';
import type { SiteInfo } from '../webMcp/types';

/**
 * Registers `rspress_get_site_info` to expose site metadata, locales, versions,
 * navigation, and the active sidebar from the current page context.
 * @unstable
 */
export function useWebMcpSiteInfo() {
  const { site } = useSite();
  const { page } = usePage();
  const nav = useNav();
  const sidebar = useSidebar();
  useWebMcp(
    defineTool(
      'get_site_info',
      'Get documentation site metadata, languages, versions, navigation and the active sidebar.',
      {},
      [],
      () =>
        ({
          title: site.title,
          description: site.description,
          base: site.base,
          siteOrigin: site.siteOrigin,
          lang: page.lang,
          version: page.version,
          locales: site.locales,
          versions: site.multiVersion.versions,
          defaultVersion: site.multiVersion.default,
          nav,
          sidebar,
        }) satisfies SiteInfo,
    ),
  );
}
