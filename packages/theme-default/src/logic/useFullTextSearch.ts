import { usePageData } from '@rspress/runtime';
import { useEffect, useRef, useState } from 'react';
import type { MatchResult } from '..';
import { PageSearcher } from '../components/Search/logic/search';
import { getSidebarGroupData } from './useSidebarData';
import { useLocaleSiteData } from './useLocaleSiteData';

export function useFullTextSearch(): {
  initialized: boolean;
  search: (keyword: string, limit?: number) => Promise<MatchResult>;
} {
  const { siteData, page } = usePageData();
  const [initialized, setInitialized] = useState(false);
  const { sidebar } = useLocaleSiteData();
  const extractGroupName = (link: string) =>
    getSidebarGroupData(sidebar, link).group;
  const searchRef = useRef<PageSearcher | null>(null);

  useEffect(() => {
    async function init() {
      if (!initialized) {
        const searcher = new PageSearcher({
          ...siteData.search,
          mode: 'local',
          currentLang: page.lang,
          currentVersion: page.version,
          extractGroupName,
        });
        searchRef.current = searcher;
        await searcher.init();
        setInitialized(true);
      }
    }
    init();
  }, []);

  return {
    initialized,
    search: searchRef.current?.match.bind(searchRef.current),
  };
}
