import { useMemo } from 'react';
import { usePage } from '../hooks/usePage';
import { searchIndexHash, usePages } from '../hooks/usePages';
import { useSite } from '../hooks/useSite';
import { useWebMcp } from '../hooks/useWebMcp';
import { defineTool, queryField } from './tools';

const options = import.meta.env.WEBMCP_OPTIONS;

export function SearchTools() {
  const { page } = usePage();
  const { site } = useSite();
  // Subscribe to the existing page-data store to refresh the index after HMR.
  usePages();
  const version =
    site.search !== false && site.search.versioned === false
      ? ''
      : page.version;
  const indexHash = searchIndexHash[`${version}###${page.lang}`];
  const search = useMemo(() => {
    if (!options.search || !indexHash) return undefined;
    let instance:
      | Promise<
          import('../../theme/components/Search/logic/search').PageSearcher
        >
      | undefined;
    return async (query: string, limit: number) => {
      instance ??= import('../../theme/components/Search/logic/search')
        .then(async ({ PageSearcher }) => {
          const searcher = new PageSearcher({
            ...site.search,
            currentLang: page.lang,
            currentVersion: version,
          });
          await searcher.init();
          return searcher;
        })
        .catch(error => {
          instance = undefined;
          throw error;
        });
      const groups = await (await instance).match(query, limit);
      return groups.map(({ group, result }) => ({ group, results: result }));
    };
  }, [site.search, page.lang, version, indexHash]);
  useWebMcp({
    ...defineTool(
      'search_docs',
      'Search the local documentation index for the active language and version.',
      {
        query: queryField,
        limit: { type: 'integer', minimum: 1, maximum: 20 },
      },
      ['query'],
      args =>
        search!(args.query as string, (args.limit as number | undefined) ?? 10),
    ),
    enabled: Boolean(search),
  });
  return null;
}
