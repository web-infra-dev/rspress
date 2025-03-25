import { usePageData } from '@rspress/runtime';
import { createPortal } from '@rspress/runtime';
import {
  type AnyFunction,
  type SearchOptions,
  isProduction,
} from '@rspress/shared';
import CloseSvg from '@theme-assets/close';
import LoadingSvg from '@theme-assets/loading';
import SearchSvg from '@theme-assets/search';
import { debounce } from 'lodash-es';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as userSearchHooks from 'virtual-search-hooks';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { SvgWrapper } from '../SvgWrapper';
import { Tab, Tabs } from '../Tabs';
import { NoSearchResult } from './NoSearchResult';
import { SuggestItem } from './SuggestItem';
import * as styles from './index.module.scss';
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

const useDebounce = <T extends AnyFunction>(cb: T) => {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  const debounced = useCallback(
    debounce(
      ((...args: Parameters<T>): ReturnType<T> => cbRef.current(...args)) as T,
      150,
    ),
    [],
  );
  return debounced;
};

export function SearchPanel({ focused, setFocused }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MatchResult>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [resultTabIndex, setResultTabIndex] = useState(0);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const pageSearcherConfigRef = useRef<PageSearcherConfig | null>(null);
  const [initStatus, setInitStatus] = useState<
    'initial' | 'initing' | 'inited'
  >('initial');
  const searchResultRef = useRef<HTMLDivElement>(null);
  const searchResultTabRef = useRef<HTMLDivElement>(null);
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
    const currentOffsetHeight = searchResultRef.current?.offsetHeight;
    const currentScrollTop = searchResultRef.current?.scrollTop;
    if (
      canScroll &&
      currentOffsetHeight !== undefined &&
      currentScrollTop !== undefined
    ) {
      // Down
      // 50 = 20(modal margin) + 40(input height) - 10(item margin)
      // -10 = 50(following) - 50(tab title) - 10(item margin)
      const scrollDown =
        offsetTop +
        offsetHeight -
        currentOffsetHeight -
        (searchResult.length === 1 ? 50 : -10);
      if (scrollDown > currentScrollTop) {
        searchResultRef.current?.scrollTo({
          top: scrollDown,
        });
      }

      // Up
      // 70 = 20(modal margin) + 40(input height) + 10(item margin)
      // 10 = 70(following) - 50(tab title) - 10(item margin)
      const scrollUp =
        searchResult.length === 1 ? offsetTop - 70 : offsetTop - 10;
      if (scrollUp < currentScrollTop) {
        searchResultRef.current?.scrollTo({
          top: scrollUp,
        });
      }
    }
  };
  const {
    siteData,
    page: { lang, version },
  } = usePageData();
  const { searchPlaceholderText = 'Search docs' } = useLocaleSiteData();
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

  if (search === false) {
    return null;
  }

  /**
   * Create page searcher instance.
   */
  const createSearcher = () => {
    if (pageSearcherRef.current) {
      return pageSearcherRef.current;
    }

    const pageSearcherConfig = {
      currentLang: lang,
      currentVersion: version,
    };
    const pageSearcher = new PageSearcher({
      indexName: siteTitle,
      ...search,
      ...pageSearcherConfig,
    });
    pageSearcherRef.current = pageSearcher;
    pageSearcherConfigRef.current = pageSearcherConfig;

    return pageSearcherRef.current;
  };

  /**
   * Call `searcher.init` to initialize the search index
   */
  async function initSearch() {
    if (initStatus !== 'initial') {
      return;
    }

    const searcher = createSearcher();

    setInitStatus('initing');
    await searcher.init();
    setInitStatus('inited');

    const query = searchInputRef.current?.value;
    if (query) {
      const matched = await searcher.match(query);
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
          // prevent arrow down key event when IME is composing
          if (e.isComposing) {
            return;
          }
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
          // prevent arrow up key event when IME is composing
          if (e.isComposing) {
            return;
          }
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
          /**
           * prevent enter key event when IME is composing, it's more friendly for CJK users.
           * @see https://github.com/web-infra-dev/rspress/issues/1861
           */
          if (e.isComposing) {
            return;
          }
          if (
            currentSuggestionIndex >= 0 &&
            currentRenderType === RenderType.Default
          ) {
            // the ResultItem has been normalized to display
            const flatSuggestions = [
              ...Object.values(normalizeSuggestions(currentSuggestions)),
            ].flat();
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
      initSearch();
    } else {
      setQuery('');
    }
  }, [focused]);

  // Prefetch the search index when the page is idle
  useEffect(() => {
    if ('requestIdleCallback' in window && !pageSearcherRef.current) {
      window.requestIdleCallback(() => {
        const searcher = createSearcher();
        searcher.fetchSearchIndex();
      });
    }
  }, []);

  // init pageSearcher again when lang or version changed
  useEffect(() => {
    const { currentLang, currentVersion } = pageSearcherConfigRef.current ?? {};
    const isLangChanged = lang !== currentLang;
    const isVersionChanged = versionedSearch && version !== currentVersion;

    if (isLangChanged || isVersionChanged) {
      // reset status first
      setInitStatus('initial');
      pageSearcherRef.current = null;
      const searcher = createSearcher();
      searcher.fetchSearchIndex();
    }
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

  const normalizeSuggestions = (
    suggestions: DefaultMatchResult['result'],
  ): Record<string, DefaultMatchResultItem[]> => {
    return suggestions.reduce(
      (groups, item) => {
        const group = item.title;
        if (!groups[group]) {
          groups[group] = [];
        }
        groups[group].push(item);
        return groups;
      },
      {} as Record<string, DefaultMatchResult['result']>,
    );
  };

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
      return indexItem!.label;
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
        <div className="rp-flex rp-flex-col rp-items-center">
          <SvgWrapper icon={LoadingSvg} className="m-8 opacity-80" />
        </div>
      );
    }

    // if no result, show the no result tip
    if (suggestionList.length === 0 && initStatus === 'inited') {
      return <NoSearchResult query={query} />;
    }

    const normalizedSuggestions = normalizeSuggestions(suggestionList);
    // accumulateIndex is used to calculate the index of the suggestion in the whole list.
    let accumulateIndex = -1;
    return (
      <ul>
        {Object.keys(normalizedSuggestions).map(group => {
          const groupSuggestions = normalizedSuggestions[group] || [];
          return (
            <li key={group}>
              <ul className="rp-pb-2">
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
              <div className="rp-flex rp-items-center">
                <div className={styles.inputForm}>
                  <label>
                    <SvgWrapper icon={SearchSvg} />
                  </label>
                  <input
                    className={`rspress-search-panel-input ${styles.input}`}
                    ref={searchInputRef}
                    placeholder={searchPlaceholderText}
                    aria-label="SearchPanelInput"
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
                  className="rp-text-brand rp-ml-2 sm:rp-hidden rp-cursor-pointer"
                  onClick={e => {
                    e.stopPropagation();
                    clearSearchState();
                  }}
                >
                  Cancel
                </h2>
              </div>

              {query && initStatus === 'inited' ? (
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
