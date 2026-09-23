import { usePageData } from '@rspress/core/runtime';
import type { LocalSearchOptions } from '@rspress/core';
import { debounce } from '@rspress/shared/lodash-es';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import * as userSearchHooks from 'virtual-search-hooks';
import { getSearchIndexURL } from './logic/providers/LocalProvider';
import { PageSearcher } from './logic/search';
import type {
  CustomMatchResult,
  DefaultMatchResult,
  MatchResult,
  PageSearcherConfig,
} from './logic/types';
import { RenderType } from './logic/types';

const useDebounce = <T extends (...args: any[]) => any>(cb: T) => {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  return useCallback(
    debounce(
      ((...args: Parameters<T>): ReturnType<T> => cbRef.current(...args)) as T,
      150,
    ),
    [],
  );
};

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
  const searchEnabled = search !== false;
  const searchOptions: LocalSearchOptions = search === false ? {} : search;
  const versionedSearch = searchEnabled && (search?.versioned ?? true);
  const searchIndexURL = searchEnabled
    ? getSearchIndexURL(lang, versionedSearch ? version : '')
    : undefined;
  const DEFAULT_RESULT = [
    { group: siteTitle, result: [], renderType: RenderType.Default },
  ];

  const createSearcher = () => {
    if (pageSearcherRef.current) {
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
    return pageSearcher;
  };

  const initSearch = async () => {
    if (initStatus !== 'initial') {
      return;
    }
    const searcher = createSearcher();
    setSearchError(undefined);
    setInitStatus('initing');
    try {
      await searcher.init();
    } catch (error) {
      if (pageSearcherRef.current !== searcher) {
        return;
      }
      setSearchError(error instanceof Error ? error.message : String(error));
      setInitStatus('error');
      setIsSearching(false);
      return;
    }
    if (pageSearcherRef.current !== searcher) {
      return;
    }
    setInitStatus('inited');
    const currentQuery = searchInputRef.current?.value;
    if (currentQuery) {
      const matched = await searcher.match(currentQuery);
      if (
        pageSearcherRef.current !== searcher ||
        searchInputRef.current?.value !== currentQuery
      ) {
        return;
      }
      setSearchResult(matched || DEFAULT_RESULT);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (!searchEnabled) {
      return;
    }
    if (focused) {
      setSearchResult(DEFAULT_RESULT);
      initSearch();
    } else {
      setQuery('');
    }
  }, [focused, searchEnabled]);

  useEffect(() => {
    if (!searchEnabled) {
      return;
    }
    const { currentLang, currentVersion } = pageSearcherConfigRef.current ?? {};
    const isLangChanged = lang !== currentLang;
    const isVersionChanged = versionedSearch && version !== currentVersion;
    if (isLangChanged || isVersionChanged) {
      setInitStatus('initial');
      setSearchError(undefined);
      setIsSearching(false);
      pageSearcherRef.current = null;
      createSearcher()
        .fetchSearchIndex()
        .catch(() => {});
    }
  }, [lang, version, versionedSearch, searchEnabled]);

  const handleQueryChangedImpl = async (value: string) => {
    let newQuery = value;
    setQuery(newQuery);
    if (!newQuery) {
      setIsSearching(false);
      return;
    }
    const result: MatchResult = [];
    if ('beforeSearch' in userSearchHooks) {
      const transformedQuery = await userSearchHooks.beforeSearch(newQuery);
      if (transformedQuery) newQuery = transformedQuery;
    }
    const defaultSearchResult = await pageSearcherRef.current?.match(newQuery);
    if (defaultSearchResult) result.push(...defaultSearchResult);
    if ('onSearch' in userSearchHooks) {
      const customSearchResult = await userSearchHooks.onSearch(
        newQuery,
        result as DefaultMatchResult[],
      );
      if (customSearchResult) {
        result.push(
          ...customSearchResult.map(
            item =>
              ({ renderType: RenderType.Custom, ...item }) as CustomMatchResult,
          ),
        );
      }
    }
    if ('afterSearch' in userSearchHooks) {
      await userSearchHooks.afterSearch(newQuery, result);
    }
    if (searchInputRef.current?.value === newQuery) {
      setCurrentSuggestionIndex(0);
      setSearchResult(result || DEFAULT_RESULT);
      setIsSearching(false);
    }
  };

  const handleQueryChange = useDebounce(handleQueryChangedImpl);
  const handleQueryInput = (value: string) => {
    setIsSearching(Boolean(value));
    handleQueryChange(value);
  };
  const clearQuery = () => {
    setQuery('');
    setIsSearching(false);
  };

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
