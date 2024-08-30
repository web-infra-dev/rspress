/* eslint-disable max-lines */
import { usePageData } from '@rspress/runtime';
import { type SearchOptions, isProduction } from '@rspress/shared';
import { debounce, groupBy } from 'lodash-es';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as userSearchHooks from 'virtual-search-hooks';
import CloseSvg from '@theme-assets/close';
import LoadingSvg from '@theme-assets/loading';
import SearchSvg from '@theme-assets/search';
import { SvgWrapper } from '../SvgWrapper';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { getSidebarGroupData } from '../../logic/useSidebarData';
import { Tab, Tabs } from '../Tabs';
import { NoSearchResult } from './NoSearchResult';
import { SuggestItem } from './SuggestItem';
import styles from './index.module.scss';
import { PageSearcher } from './logic/search';
import type {
  CustomMatchResult,
  DefaultMatchResult,
  DefaultMatchResultItem,
  MatchResult,
  PageSearcherConfig,
} from './logic/types';
import { RenderType } from './logic/types';
import { normalizeSearchIndexes, removeDomain } from './logic/util';

const KEY_CODE = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ENTER: 'Enter',
  SEARCH: 'KeyK',
  ESC: 'Escape',
};

export interface SearchPanelProps {
  focused: boolean;
  setFocused: (focused: boolean) => void;
}

const useDebounce = <T extends (...args: any[]) => void>(cb: T): T => {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const debounced = useCallback(
    debounce((...args: any) => cbRef.current(...args), 150),
    [],
  );
  return debounced as unknown as T;
};

export function SearchPanel({ focused, setFocused }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MatchResult>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [initing, setIniting] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [resultTabIndex, setResultTabIndex] = useState(0);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const pageSearcherConfigRef = useRef<PageSearcherConfig | null>(null);
  const searchResultRef = useRef(null);
  const searchResultTabRef = useRef(null);
  const mousePositionRef = useRef<{
    pageX: number | null;
    pageY: number | null;
  }>({
    pageX: null,
    pageY: null,
  });

  // only scroll after keydown arrow up and arrow down.
  const [canScroll, setCanScroll] = useState(false);
  const scrollTo = (offsetTop: number, offsetHeight: number) => {
    if (canScroll) {
      // Down
      // 50 = 20(modal margin) + 40(input height) - 10(item margin)
      // -10 = 50(following) - 50(tab title) - 10(item margin)
      const scrollDown =
        offsetTop +
        offsetHeight -
        searchResultRef?.current?.offsetHeight -
        (searchResult.length === 1 ? 50 : -10);
      if (scrollDown > searchResultRef?.current?.scrollTop) {
        searchResultRef?.current?.scrollTo({
          top: scrollDown,
        });
      }

      // Up
      // 70 = 20(modal margin) + 40(input height) + 10(item margin)
      // 10 = 70(following) - 50(tab title) - 10(item margin)
      const scrollUp =
        searchResult.length === 1 ? offsetTop - 70 : offsetTop - 10;
      if (scrollUp < searchResultRef?.current?.scrollTop) {
        searchResultRef?.current?.scrollTo({
          top: scrollUp,
        });
      }
    }
  };
  const {
    siteData,
    page: { lang, version },
  } = usePageData();
  const { sidebar, searchPlaceholderText = 'Search Docs' } =
    useLocaleSiteData();
  const { search, title: siteTitle } = siteData;
  const versionedSearch =
    search && search.mode !== 'remote' && search.versioned;
  const DEFAULT_RESULT = [
    { group: siteTitle, result: [], renderType: RenderType.Default },
  ];
  const currentSuggestions =
    (searchResult[resultTabIndex]?.result as DefaultMatchResultItem[]) ?? [];
  const currentRenderType =
    searchResult[resultTabIndex]?.renderType ?? RenderType.Default;

  // We need to extract the group name by the link so that we can divide the search result into different groups.
  const extractGroupName = (link: string) =>
    getSidebarGroupData(sidebar, link).group;

  async function initPageSearcher() {
    if (search === false) {
      return;
    }
    const pageSearcherConfig = {
      currentLang: lang,
      currentVersion: version,
      extractGroupName,
    };
    const pageSearcher = new PageSearcher({
      indexName: siteTitle,
      ...search,
      ...pageSearcherConfig,
    });
    pageSearcherRef.current = pageSearcher;
    pageSearcherConfigRef.current = pageSearcherConfig;
    await pageSearcherRef.current.init();
    setIniting(false);
    const query = searchInputRef.current?.value;
    if (query) {
      const matched = await pageSearcherRef.current?.match(query);
      setSearchResult(matched || DEFAULT_RESULT);
      setIsSearching(false);
    }
  }

  const clearSearchState = () => {
    setFocused(false);
    setResultTabIndex(0);
    setCurrentSuggestionIndex(0);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case KEY_CODE.SEARCH:
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setFocused(!focused);
          }
          break;
        case KEY_CODE.ARROW_DOWN:
          if (focused) {
            e.preventDefault();
            if (
              currentSuggestions &&
              currentRenderType === RenderType.Default
            ) {
              setCanScroll(true);
              setCurrentSuggestionIndex(
                (currentSuggestionIndex + 1) % currentSuggestions.length,
              );
            }
          }
          break;
        case KEY_CODE.ARROW_UP:
          if (focused) {
            e.preventDefault();
            if (currentRenderType === RenderType.Default) {
              const currentSuggestionsLength = currentSuggestions.length;
              setCanScroll(true);
              setCurrentSuggestionIndex(
                (currentSuggestionIndex - 1 + currentSuggestionsLength) %
                  currentSuggestionsLength,
              );
            }
          }
          break;
        case KEY_CODE.ENTER:
          if (
            currentSuggestionIndex >= 0 &&
            currentRenderType === RenderType.Default
          ) {
            // the ResultItem has been normalized to display
            const flatSuggestions = [].concat(
              ...Object.values(normalizeSuggestions(currentSuggestions)),
            );
            const suggestion = flatSuggestions[currentSuggestionIndex];
            const isCurrent = resultTabIndex === 0;
            if (isCurrent) {
              window.location.href = isProduction()
                ? suggestion.link
                : removeDomain(suggestion.link);
            } else {
              window.open(suggestion.link);
            }
            clearSearchState();
          }
          break;
        case KEY_CODE.ESC:
          clearSearchState();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [
    setCurrentSuggestionIndex,
    setFocused,
    focused,
    resultTabIndex,
    currentSuggestions,
    currentSuggestionIndex,
  ]);

  useEffect(() => {
    if (focused) {
      setSearchResult(DEFAULT_RESULT);
      if (!pageSearcherRef.current) {
        initPageSearcher();
      }
    } else {
      setQuery('');
    }
  }, [focused]);

  useEffect(() => {
    const { currentLang, currentVersion } = pageSearcherConfigRef.current ?? {};
    const isLangChanged = lang !== currentLang;
    const isVersionChanged = versionedSearch && version !== currentVersion;

    if (!initing && (isLangChanged || isVersionChanged)) {
      initPageSearcher();
    }
    // init pageSearcher again when lang or version changed
  }, [lang, version, versionedSearch]);

  const handleQueryChangedImpl = async (value: string) => {
    let newQuery = value;
    setQuery(newQuery);
    if (search && search.mode === 'remote' && search.searchLoading) {
      setIsSearching(true);
    }
    if (newQuery) {
      const searchResult: MatchResult = [];

      if ('beforeSearch' in userSearchHooks) {
        const key = 'beforeSearch' as const;
        const transformedQuery = await userSearchHooks[key](newQuery);
        if (transformedQuery) {
          newQuery = transformedQuery;
        }
      }

      const defaultSearchResult =
        await pageSearcherRef.current?.match(newQuery);

      if (defaultSearchResult) {
        searchResult.push(...defaultSearchResult);
      }

      if ('onSearch' in userSearchHooks) {
        const key = 'onSearch' as const;
        const customSearchResult = await userSearchHooks[key](
          newQuery,
          searchResult as DefaultMatchResult[],
        );
        if (customSearchResult) {
          searchResult.push(
            ...customSearchResult.map(
              item =>
                ({
                  renderType: RenderType.Custom,
                  ...item,
                }) as CustomMatchResult,
            ),
          );
        }
      }

      if ('afterSearch' in userSearchHooks) {
        const key = 'afterSearch' as const;
        await userSearchHooks[key](newQuery, searchResult);
      }

      // only setSearchResult when query is current query value
      const currQuery = searchInputRef.current?.value;
      if (currQuery === newQuery) {
        setSearchResult(searchResult || DEFAULT_RESULT);
        setIsSearching(false);
      }
    }
  };

  const handleQueryChange = useDebounce(handleQueryChangedImpl);

  const normalizeSuggestions = (suggestions: DefaultMatchResult['result']) =>
    groupBy(suggestions, 'group');

  const renderSearchResult = (
    result: MatchResult,
    searchOptions: SearchOptions,
    isSearching: boolean,
  ) => {
    if (result.length === 1) {
      const currentSearchResult = result[0]
        .result as DefaultMatchResult['result'];
      if (currentSearchResult.length === 0 && !isSearching) {
        return <NoSearchResult query={query} />;
      }
      return (
        <div ref={searchResultTabRef}>
          {renderSearchResultItem(currentSearchResult, query, isSearching)}
        </div>
      );
    }

    const tabValues = result.map(item => {
      if (!searchOptions || searchOptions.mode !== 'remote') {
        return item.group;
      }
      const indexItem = normalizeSearchIndexes(
        searchOptions.searchIndexes || [],
      ).find(indexInfo => indexInfo.value === item.group);
      return indexItem.label;
    });

    const renderKey = 'render' as const;

    return (
      <Tabs
        values={tabValues}
        tabContainerClassName={styles.tabClassName}
        onChange={index => {
          setResultTabIndex(index);
          setCurrentSuggestionIndex(0);
        }}
        // @ts-ignore
        ref={searchResultTabRef}
      >
        {result.map(item => (
          <Tab key={item.group}>
            {item.renderType === RenderType.Default &&
              renderSearchResultItem(item.result, query, isSearching)}
            {item.renderType === RenderType.Custom &&
              userSearchHooks[renderKey](item.result)}
          </Tab>
        ))}
      </Tabs>
    );
  };

  const renderSearchResultItem = (
    suggestionList: DefaultMatchResult['result'],
    query: string,
    isSearching: boolean,
  ) => {
    // if isSearching, show loading svg
    if (isSearching) {
      return (
        <div className="flex flex-col items-center">
          <SvgWrapper icon={LoadingSvg} className="m-8 opacity-80" />
        </div>
      );
    }
    // if no result, show no result
    if (suggestionList.length === 0 && !initing) {
      return <NoSearchResult query={query} />;
    }
    const normalizedSuggestions = normalizeSuggestions(suggestionList);
    // accumulateIndex is used to calculate the index of the suggestion in the whole list.
    let accumulateIndex = -1;
    return (
      <ul className={styles.suggestList}>
        {Object.keys(normalizedSuggestions).map(group => {
          const groupSuggestions = normalizedSuggestions[group] || [];
          return (
            <li key={group}>
              <ul className="pb-2">
                {groupSuggestions.map(suggestion => {
                  accumulateIndex++;
                  const suggestionIndex = accumulateIndex;
                  return (
                    <SuggestItem
                      key={`${suggestion.title}-${suggestionIndex}`}
                      suggestion={suggestion}
                      isCurrent={suggestionIndex === currentSuggestionIndex}
                      setCurrentSuggestionIndex={event => {
                        if (
                          mousePositionRef.current.pageX === event.pageX &&
                          mousePositionRef.current.pageY === event.pageY
                        ) {
                          return;
                        }

                        setCanScroll(false);
                        setCurrentSuggestionIndex(suggestionIndex);
                      }}
                      onMouseMove={event => {
                        mousePositionRef.current = {
                          pageX: event.pageX,
                          pageY: event.pageY,
                        };
                      }}
                      closeSearch={() => {
                        clearSearchState();
                      }}
                      inCurrentDocIndex={resultTabIndex === 0}
                      scrollTo={scrollTo}
                    />
                  );
                })}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      {focused &&
        createPortal(
          <div
            className={styles.mask}
            onClick={() => {
              clearSearchState();
            }}
          >
            <div
              className={`${styles.modal}`}
              onClick={e => {
                setFocused(true);
                e.stopPropagation();
              }}
            >
              <div className="flex items-center">
                <div className={styles.inputForm}>
                  <label>
                    <SvgWrapper icon={SearchSvg} />
                  </label>
                  <input
                    className={styles.input}
                    ref={searchInputRef}
                    placeholder={searchPlaceholderText}
                    aria-label="Search"
                    autoComplete="off"
                    autoFocus
                    onChange={e => handleQueryChange(e.target.value)}
                  />
                  <label>
                    <SvgWrapper
                      icon={CloseSvg}
                      className={styles.close}
                      onClick={e => {
                        if (searchInputRef.current) {
                          e.stopPropagation();
                          if (!query) {
                            clearSearchState();
                          } else {
                            searchInputRef.current.value = '';
                            setQuery('');
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <h2
                  className="text-brand ml-2 sm:hidden cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    clearSearchState();
                  }}
                >
                  Cancel
                </h2>
              </div>

              {query && !initing ? (
                <div
                  className={`${styles.searchHits}  rspress-scrollbar`}
                  ref={searchResultRef}
                >
                  {renderSearchResult(searchResult, search, isSearching)}
                </div>
              ) : null}
            </div>
          </div>,
          document.getElementById('search-container')!,
        )}
    </>
  );
}
