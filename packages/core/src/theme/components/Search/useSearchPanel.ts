import { usePageData, useSearchHooks, useWebMcp } from '@rspress/core/runtime';
import type { LocalSearchOptions } from '@rspress/core';
import { debounce } from '@rspress/shared/lodash-es';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';

import { getSearchIndexURL } from './logic/providers/LocalProvider';
import { PageSearcher } from './logic/search';
import type {
  CustomMatchResult,
  DefaultMatchResult,
  MatchResult,
  PageSearcherConfig,
} from './logic/types';
import { RenderType } from './logic/types';
// eslint-disable-next-line no-restricted-imports -- Existing cross-directory dependency; retained until this component is eject-safe.
import {
  defineTool,
  queryField,
  toWebMcpSearchResults,
} from '../../webMcp/tools';

export function useSearchPanel({
  focused,
  searchInputRef,
}: {
  focused: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
}) {
  const {
    siteData,
    page: { lang, version },
  } = usePageData();
  const userSearchHooks = useSearchHooks();
  const { search, title: siteTitle } = siteData;
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MatchResult>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [resultTabIndex, setResultTabIndex] = useState(0);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [initStatus, setInitStatus] = useState<
    'initial' | 'initing' | 'inited' | 'error'
  >('initial');
  const [searchError, setSearchError] = useState<string>();
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const pageSearcherConfigRef = useRef<PageSearcherConfig | null>(null);
  const pageSearcherURLRef = useRef<string | undefined>(undefined);
  const initializationRef = useRef<
    { searcher: PageSearcher; promise: Promise<void> } | undefined
  >(undefined);
  const searchEnabled = search !== false;
  const searchOptions: LocalSearchOptions = search === false ? {} : search;
  const versionedSearch = searchEnabled && (search?.versioned ?? true);
  const searchVersion = versionedSearch ? version : '';
  const searchIndexURL = searchEnabled
    ? getSearchIndexURL(lang, searchVersion)
    : undefined;
  const DEFAULT_RESULT = [
    { group: siteTitle, result: [], renderType: RenderType.Default },
  ];

  const createSearcher = () => {
    const previous = pageSearcherConfigRef.current;
    if (
      pageSearcherRef.current &&
      previous?.currentLang === lang &&
      (!versionedSearch || previous.currentVersion === version) &&
      pageSearcherURLRef.current === searchIndexURL
    ) {
      return pageSearcherRef.current;
    }
    const pageSearcherConfig = { currentLang: lang, currentVersion: version };
    const pageSearcher = new PageSearcher({
      indexName: siteTitle,
      ...searchOptions,
      ...pageSearcherConfig,
    });
    pageSearcherRef.current = pageSearcher;
    pageSearcherConfigRef.current = pageSearcherConfig;
    pageSearcherURLRef.current = searchIndexURL;
    return pageSearcher;
  };

  // UI searches and agent calls initialize the same provider once, on demand.
  const initializeSearcher = (searcher: PageSearcher) => {
    if (initializationRef.current?.searcher === searcher)
      return initializationRef.current.promise;
    const promise = searcher.init().catch(error => {
      if (initializationRef.current?.searcher === searcher)
        initializationRef.current = undefined;
      throw error;
    });
    initializationRef.current = { searcher, promise };
    return promise;
  };

  const searchDocs = async (value: string, limit?: number) => {
    const searcher = createSearcher();
    let newQuery = value;
    const result: MatchResult = [];
    if (userSearchHooks.beforeSearch) {
      const transformedQuery = await userSearchHooks.beforeSearch(newQuery);
      if (transformedQuery) newQuery = transformedQuery;
    }
    await initializeSearcher(searcher);
    const defaultSearchResult = await searcher.match(newQuery, limit);
    result.push(...defaultSearchResult);
    if (userSearchHooks.onSearch) {
      const customSearchResult = await userSearchHooks.onSearch(
        newQuery,
        result as DefaultMatchResult[],
      );
      if (customSearchResult)
        result.push(
          ...customSearchResult.map(
            item =>
              ({ renderType: RenderType.Custom, ...item }) as CustomMatchResult,
          ),
        );
    }
    await userSearchHooks.afterSearch?.(newQuery, result);
    return result;
  };

  // Build-time gating keeps tool code out of sites that do not enable WebMCP.
  if (import.meta.env.ENABLE_WEBMCP) {
    useWebMcp({
      ...defineTool(
        'search_docs',
        'Search documentation through the active local search component.',
        {
          query: queryField,
          limit: { type: 'integer', minimum: 1, maximum: 20 },
        },
        ['query'],
        async args =>
          toWebMcpSearchResults(
            await searchDocs(
              args.query as string,
              (args.limit as number | undefined) ?? 10,
            ),
          ),
      ),
      enabled:
        searchEnabled && Boolean(searchIndexURL || userSearchHooks.onSearch),
    });
  }

  const requestIdRef = useRef(0);
  const scheduleQuery = useMemo(
    () => debounce((run: () => void) => run(), 150),
    [],
  );
  const invalidateQuery = useCallback(() => {
    requestIdRef.current++;
    scheduleQuery.cancel();
  }, [scheduleQuery]);

  // A query belongs to the popup session and index that started it.
  useLayoutEffect(
    () => invalidateQuery,
    [
      focused,
      searchEnabled,
      lang,
      searchVersion,
      searchIndexURL,
      invalidateQuery,
    ],
  );

  useLayoutEffect(() => {
    pageSearcherRef.current = null;
    setInitStatus('initial');
    setSearchError(undefined);
  }, [searchEnabled, lang, searchVersion, searchIndexURL]);

  const initSearch = async () => {
    const searcher = createSearcher();
    if (
      initStatus !== 'initial' &&
      initializationRef.current?.searcher === searcher
    ) {
      return;
    }
    setSearchError(undefined);
    setInitStatus('initing');
    try {
      await initializeSearcher(searcher);
      if (pageSearcherRef.current === searcher) {
        setInitStatus('inited');
      }
    } catch (error) {
      if (pageSearcherRef.current === searcher) {
        setSearchError(error instanceof Error ? error.message : String(error));
        setInitStatus('error');
      }
    }
  };

  const runQuery = async (value: string, requestId: number) => {
    const isCurrent = () =>
      requestId === requestIdRef.current &&
      searchInputRef.current?.value === value;
    if (!isCurrent()) return;

    setQuery(value);
    try {
      const result = await searchDocs(value);
      if (isCurrent()) {
        setSearchError(undefined);
        setInitStatus('inited');
        setCurrentSuggestionIndex(0);
        setSearchResult(result);
        setIsSearching(false);
      }
    } catch (error) {
      if (isCurrent()) {
        setSearchError(error instanceof Error ? error.message : String(error));
        setInitStatus('error');
        setIsSearching(false);
      }
    }
  };

  const clearQuery = () => {
    invalidateQuery();
    setQuery('');
    setIsSearching(false);
  };

  const handleQueryInput = (value: string) => {
    if (!value) {
      clearQuery();
      return;
    }
    // Assign the ID before debounce so a previous request cannot publish while
    // the latest input is waiting to start, even if the text is identical.
    const requestId = ++requestIdRef.current;
    setIsSearching(true);
    scheduleQuery(() => {
      void runQuery(value, requestId);
    });
  };

  useEffect(() => {
    if (!focused || !searchEnabled) {
      clearQuery();
      return;
    }

    setSearchResult(DEFAULT_RESULT);
    const value = searchInputRef.current?.value;
    if (value) {
      handleQueryInput(value);
    } else {
      void initSearch();
    }
  }, [focused, searchEnabled, lang, searchVersion, searchIndexURL]);

  return {
    searchEnabled,
    clearQuery,
    currentRenderType:
      searchResult[resultTabIndex]?.renderType ?? RenderType.Default,
    currentSuggestions:
      (searchResult[resultTabIndex]?.result as DefaultMatchResult['result']) ??
      [],
    handleQueryInput,
    initStatus,
    isSearching,
    resultTabIndex,
    searchError,
    searchIndexURL,
    searchResult,
    query,
    currentSuggestionIndex,
    setCurrentSuggestionIndex,
    setResultTabIndex,
  };
}
