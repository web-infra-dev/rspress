import { useLang } from '@rspress/runtime';
import { useEffect, useState } from 'react';
import { MatchResult } from '..';
import { PageSearcher } from '../components/Search/logic/search';
import { getSidebarGroupData } from './useSidebarData';
import { useLocaleSiteData } from './useLocaleSiteData';

export function useFullTextSearch(): {
  initialized: boolean;
  search: (keyword: string, limit?: number) => Promise<MatchResult>;
} {
  const lang = useLang();
  const [initialized, setInitialized] = useState(false);
  const { sidebar } = useLocaleSiteData();
  const extractGroupName = (link: string) =>
    getSidebarGroupData(sidebar, link).group;

  const searcher = new PageSearcher({
    mode: 'local',
    currentLang: lang,
    extractGroupName,
  });

  useEffect(() => {
    async function init() {
      if (!initialized) {
        await searcher.init();
        setInitialized(true);
      }
    }
    init();
  });

  return {
    initialized,
    search: searcher.match.bind(searcher),
  };
}
