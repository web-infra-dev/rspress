import { usePageData } from '@rspress/core/runtime';
import { useEffect, useMemo, useState } from 'react';
import { PageSearcher } from '../components/Search/logic/search';
import type { MatchResult } from '../components/Search/logic/types';

type Search = (keyword: string, limit?: number) => Promise<MatchResult>;

type FullTextSearchState =
  | { initialized: false; search: undefined }
  | { initialized: true; search: Search };

export function useFullTextSearch(): FullTextSearchState {
  const { siteData, page } = usePageData();
  const searchOptions = siteData.search;
  const versionedSearch =
    searchOptions !== false && (searchOptions.versioned ?? true);
  const currentVersion = versionedSearch ? page.version : '';
  const searcher = useMemo(
    () =>
      searchOptions === false
        ? null
        : new PageSearcher({
            ...searchOptions,
            mode: 'local',
            currentLang: page.lang,
            currentVersion,
          }),
    [searchOptions, page.lang, currentVersion],
  );
  const [initializedSearcher, setInitializedSearcher] =
    useState<PageSearcher | null>(null);

  useEffect(() => {
    setInitializedSearcher(null);
    if (!searcher) {
      return;
    }

    let active = true;
    void searcher.init().then(() => {
      if (active) {
        setInitializedSearcher(searcher);
      }
    });

    return () => {
      active = false;
    };
  }, [searcher]);

  if (initializedSearcher !== searcher || !searcher) {
    return { initialized: false, search: undefined };
  }

  return {
    initialized: true,
    search: searcher.match.bind(searcher),
  };
}
