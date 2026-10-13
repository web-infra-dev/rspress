import { usePage, usePages, useWebMcp } from '@rspress/core/runtime';
import { defineTool, listPages, queryField } from '../webMcp/tools';

/**
 * Registers `rspress_list_pages` for filtered, paginated page discovery,
 * defaulting to the active language and version without requiring search.
 * @unstable
 */
export function useWebMcpPageList() {
  const { page } = usePage();
  const { pages } = usePages();
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
}
