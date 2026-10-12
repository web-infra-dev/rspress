import { useNav } from '../hooks/useNav';
import { usePage } from '../hooks/usePage';
import { usePages } from '../hooks/usePages';
import { useSidebar } from '../hooks/useSidebar';
import { useSite } from '../hooks/useSite';
import { useWebMcp } from '../hooks/useWebMcp';
import { defineTool, listPages, queryField } from './tools';
import type { SiteInfo } from './types';

export function SiteTools() {
  const { site } = useSite();
  const { page } = usePage();
  const { pages } = usePages();
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
  useWebMcp(
    defineTool(
      'list_pages',
      'List documentation pages, optionally filtering titles, descriptions and headings. Defaults to the active language and version.',
      {
        query: queryField,
        lang: { type: 'string' },
        version: { type: 'string' },
        limit: { type: 'integer', minimum: 1, maximum: 100 },
        offset: { type: 'integer', minimum: 0 },
      },
      [],
      args => listPages(pages, page, args),
    ),
  );
  return null;
}
