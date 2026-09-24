import { Head, useI18n, useSearchHooks } from '@rspress/core/runtime';
import {
  IconClose,
  IconSearch,
  SvgWrapper,
  Tab,
  Tabs,
  useLinkNavigate,
} from '@rspress/core/theme';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type {
  DefaultMatchResult,
  DefaultMatchResultItem,
  MatchResult,
} from './logic/types';
import { RenderType } from './logic/types';
import { NoSearchResult } from './NoSearchResult';
import './SearchPanel.scss';
import { SuggestItem } from './SuggestItem';
import { useSearchPanel } from './useSearchPanel';

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

const normalizeSuggestions = (
  suggestions: DefaultMatchResult['result'],
): Map<string, DefaultMatchResultItem[]> => {
  return suggestions.reduce(
    (groups, item) => {
      const group = item.title;
      if (!groups.has(group)) {
        groups.set(group, []);
      }
      groups.get(group)!.push(item);
      return groups;
    },
    new Map() as Map<string, DefaultMatchResult['result']>,
  );
};

export function SearchPanel({ focused, setFocused }: SearchPanelProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
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
  const t = useI18n();
  const userSearchHooks = useSearchHooks();
  const navigate = useLinkNavigate();

  const {
    currentRenderType,
    currentSuggestions,
    currentSuggestionIndex,
    clearQuery,
    handleQueryInput,
    initStatus,
    isSearching,
    query,
    resultTabIndex,
    searchError,
    searchIndexURL,
    searchResult,
    searchEnabled,
    setCurrentSuggestionIndex,
    setResultTabIndex,
  } = useSearchPanel({ focused, searchInputRef });

  if (!searchEnabled) {
    return null;
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
            const flatSuggestions = Array.from(
              normalizeSuggestions(currentSuggestions).values(),
            ).flat();
            const suggestion = flatSuggestions[currentSuggestionIndex];
            navigate(suggestion.link);
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

  const renderSearchResult = (result: MatchResult) => {
    if (result.length === 1) {
      const currentSearchResult = result[0]
        .result as DefaultMatchResult['result'];
      return (
        <div ref={searchResultTabRef}>
          {renderSearchResultItem(currentSearchResult)}
        </div>
      );
    }

    const renderKey = 'render' as const;

    return (
      <Tabs
        className="rp-search-panel__tabs"
        onChange={index => {
          setResultTabIndex(index);
          setCurrentSuggestionIndex(0);
        }}
        keepDOM={false}
        ref={searchResultTabRef}
      >
        {result.map(item => (
          <Tab key={item.group} label={item.group}>
            {item.renderType === RenderType.Default &&
              renderSearchResultItem(item.result)}
            {item.renderType === RenderType.Custom &&
              userSearchHooks[renderKey]?.(item.result)}
          </Tab>
        ))}
      </Tabs>
    );
  };

  const renderSearchResultItem = (
    suggestionList: DefaultMatchResult['result'],
  ) => {
    // Wait for the current search before showing the no-results message.
    if (suggestionList.length === 0 && initStatus === 'inited') {
      return isSearching ? null : <NoSearchResult query={query} />;
    }

    const normalizedSuggestions = normalizeSuggestions(suggestionList);
    // accumulateIndex is used to calculate the index of the suggestion in the whole list.
    let accumulateIndex = -1;
    return (
      <ul>
        {Array.from(normalizedSuggestions.keys()).map(group => {
          const groupSuggestions = normalizedSuggestions.get(group) || [];
          return (
            <li key={group}>
              <ul className="rp-search-panel__group">
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
      {searchIndexURL && (
        <Head>
          <link rel="prefetch" href={searchIndexURL} />
        </Head>
      )}
      {focused &&
        createPortal(
          <div
            className="rp-search-panel__mask"
            onClick={() => {
              clearSearchState();
            }}
          >
            <div
              className="rp-search-panel__modal"
              onClick={e => {
                setFocused(true);
                e.stopPropagation();
              }}
            >
              <div className="rp-search-panel__header">
                <div className="rp-search-panel__input-form">
                  <label>
                    <SvgWrapper
                      icon={IconSearch}
                      className={`rp-search-panel__search-icon${
                        initStatus === 'initing' || isSearching
                          ? ' rp-search-panel__search-icon--loading'
                          : ''
                      }`}
                    />
                  </label>
                  <input
                    className="rp-search-panel__input"
                    ref={searchInputRef}
                    placeholder={t('searchPlaceholderText')}
                    aria-label="SearchPanelInput"
                    autoComplete="off"
                    autoFocus
                    inputMode="search"
                    onChange={e => {
                      const value = e.target.value;
                      handleQueryInput(value);
                    }}
                  />
                  <label>
                    <SvgWrapper
                      icon={IconClose}
                      className="rp-search-panel__close"
                      onClick={e => {
                        if (searchInputRef.current) {
                          e.stopPropagation();
                          if (!query) {
                            clearSearchState();
                          } else {
                            searchInputRef.current.value = '';
                            clearQuery();
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                <h2
                  className="rp-search-panel__cancel"
                  onClick={e => {
                    e.stopPropagation();
                    clearSearchState();
                  }}
                >
                  {t('searchPanelCancelText')}
                </h2>
              </div>

              {(query || initStatus === 'error') &&
              (initStatus === 'inited' || initStatus === 'error') ? (
                <div
                  className="rp-search-panel__results rp-scrollbar"
                  ref={searchResultRef}
                >
                  {initStatus === 'error' ? (
                    <div className="rp-search-panel__error">
                      Error: {searchError}
                    </div>
                  ) : (
                    renderSearchResult(searchResult)
                  )}
                </div>
              ) : null}
            </div>
          </div>,
          document.getElementById('__rspress_modal_container')!,
        )}
    </>
  );
}
