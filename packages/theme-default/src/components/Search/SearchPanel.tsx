/* eslint-disable max-lines */
import { usePageData } from '@rspress/runtime';
import { SearchOptions, isProduction } from '@rspress/shared';
import { debounce, groupBy } from 'lodash-es';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  MatchResult,
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

export function SearchPanel({ focused, setFocused }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [searchResult, setSearchResult] = useState<MatchResult>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [initing, setIniting] = useState(true);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const pageSearcherRef = useRef<PageSearcher | null>(null);
  const searchResultRef = useRef(null);
  const searchResultTabRef = useRef(null);

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
    page: { lang },
  } = usePageData();
  const { sidebar } = useLocaleSiteData();
  const { search, title: siteTitle } = siteData;
  const DEFAULT_RESULT = [
    { group: siteTitle, result: [], renderType: RenderType.Default },
  ];
  const [currentSuggestions, setCurrentSuggestions] = useState<
    DefaultMatchResult['result']
  >([]);
  const [currentRenderType, setCurrentRenderType] = useState<RenderType>(
    RenderType.Default,
  );

  // We need to extract the group name by the link so that we can divide the search result into different groups.
  const extractGroupName = (link: string) =>
    getSidebarGroupData(sidebar, link).group;

  async function initPageSearcher() {
    if (search === false) {
      return;
    }
    const pageSearcher = new PageSearcher({
      indexName: siteTitle,
      ...search,
      currentLang: lang,
      extractGroupName,
    });
    pageSearcherRef.current = pageSearcher;
    await Promise.all([
      pageSearcherRef.current.init(),
      new Promise(resolve => setTimeout(resolve, 1000)),
    ]);
    setIniting(false);
    const query = searchInputRef.current?.value;
    if (query) {
      const matched = await pageSearcherRef.current?.match(query);
      setSearchResult(matched || DEFAULT_RESULT);
    }
  }

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
            const suggestion = currentSuggestions[currentSuggestionIndex];
            const isCurrent = currentSuggestions === searchResult[0].result;
            if (isCurrent) {
              window.location.href = isProduction()
                ? suggestion.link
                : removeDomain(suggestion.link);
              setFocused(false);
            } else {
              window.open(suggestion.link);
            }
          }
          break;
        case KEY_CODE.ESC:
          setFocused(false);
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
    !initing && initPageSearcher();
    // init pageSearcher again when lang changed
  }, [lang]);

  const handleQueryChangedImpl = async (value: string) => {
    let newQuery = value;
    setQuery(newQuery);
    if (newQuery) {
      const searchResult: MatchResult = [];

      if (userSearchHooks.beforeSearch) {
        const transformedQuery = await userSearchHooks.beforeSearch(newQuery);
        if (transformedQuery) {
          newQuery = transformedQuery;
        }
      }

      const defaultSearchResult =
        await pageSearcherRef.current?.match(newQuery);

      if (defaultSearchResult) {
        searchResult.push(...defaultSearchResult);
      }

      if (userSearchHooks.onSearch) {
        const customSearchResult = await userSearchHooks.onSearch(
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

      setSearchResult(searchResult || DEFAULT_RESULT);

      if (userSearchHooks.afterSearch) {
        await userSearchHooks.afterSearch(newQuery, searchResult);
      }

      if (searchResult.length > 0) {
        setCurrentSuggestions(
          searchResult[0].result as DefaultMatchResult['result'],
        );
      }
    }
  };
  const handleQueryChange = useMemo(
    () => debounce(handleQueryChangedImpl, 150),
    [],
  );

  const normalizeSuggestions = (suggestions: DefaultMatchResult['result']) =>
    groupBy(suggestions, 'group');

  // accumulateIndex is used to calculate the index of the suggestion in the whole list.
  let accumulateIndex = -1;

  const renderSearchResult = (
    result: MatchResult,
    searchOptions: SearchOptions,
  ) => {
    if (result.length === 1) {
      const currentSearchResult = result[0]
        .result as DefaultMatchResult['result'];
      if (currentSearchResult.length === 0) {
        return <NoSearchResult query={query} />;
      }
      return (
        <div ref={searchResultTabRef}>
          {renderSearchResultItem(currentSearchResult)}
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

    return (
      <Tabs
        values={tabValues}
        tabContainerClassName={styles.tabClassName}
        onChange={index => {
          setCurrentSuggestions(
            result[index].result as DefaultMatchResult['result'],
          );
          setCurrentSuggestionIndex(0);
          setCurrentRenderType(result[index].renderType);
        }}
        // @ts-ignore
        ref={searchResultTabRef}
      >
        {result.map(item => (
          <Tab key={item.group}>
            {item.renderType === RenderType.Default &&
              renderSearchResultItem(item.result)}
            {item.renderType === RenderType.Custom &&
              userSearchHooks.render(item.result)}
          </Tab>
        ))}
      </Tabs>
    );
  };

  const renderSearchResultItem = (
    suggestionList: DefaultMatchResult['result'],
  ) => {
    // if no result, show no result
    if (suggestionList.length === 0 && !initing) {
      return (
        <div className="mt-4 flex-center">
          <div
            className="p-2 font-bold text-md"
            style={{
              color: '#2c3e50',
            }}
          >
            No results found
          </div>
        </div>
      );
    }
    const normalizedSuggestions = normalizeSuggestions(suggestionList);
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
                      setCurrentSuggestionIndex={() => {
                        setCanScroll(false);
                        setCurrentSuggestionIndex(suggestionIndex);
                      }}
                      closeSearch={() => setFocused(false)}
                      inCurrentDocIndex={
                        currentSuggestions === searchResult[0].result
                      }
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
          <div className={styles.mask} onClick={() => setFocused(false)}>
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
                    placeholder="Search Docs"
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
                            setFocused(false);
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
                    setFocused(false);
                  }}
                >
                  Cancel
                </h2>
              </div>

              {query ? (
                <div
                  className={`${styles.searchHits}  rspress-scrollbar`}
                  ref={searchResultRef}
                >
                  {renderSearchResult(searchResult, search)}
                </div>
              ) : null}
              {initing && (
                <div className="flex-center">
                  <div className="p-2 text-sm">
                    <SvgWrapper icon={LoadingSvg} />
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.getElementById('search-container')!,
        )}
    </>
  );
}
