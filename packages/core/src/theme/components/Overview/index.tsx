import type {
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/core';
import {
  isEqualPath,
  useLocaleSiteData,
  usePageData,
  useSidebar,
} from '@rspress/runtime';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FallbackHeading } from '../DocContent/FallbackHeading';
import {
  isSidebarDivider,
  isSidebarSectionHeader,
  isSidebarSingleFile,
} from '../Sidebar/utils';
import './index.scss';
import { type Group, type GroupItem, OverviewGroup } from '@theme';
import { findItemByRoutePath } from './utils';

// Utility function to normalize text for search
const normalizeText = (s: string) => s.toLowerCase().replace(/-/g, ' ');

// Utility function to check if text matches query
const matchesQuery = (text: string, query: string) =>
  normalizeText(text).includes(normalizeText(query));

// JSX fragment for the search input
const OverviewSearchInput = ({
  query,
  setQuery,
  searchRef,
  filterNameText,
  filterPlaceholderText,
}: {
  query: string;
  setQuery: (query: string) => void;
  searchRef: React.RefObject<HTMLInputElement | null>;
  filterNameText: string;
  filterPlaceholderText: string;
}) => {
  return (
    <div className="rp-overview-search">
      <label htmlFor="api-filter" className="rp-overview-search__label">
        {filterNameText}
      </label>
      <input
        ref={searchRef}
        type="search"
        placeholder={filterPlaceholderText}
        id="api-filter"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="rp-overview-search__input"
      />
    </div>
  );
};

// JSX fragment for rendering a group

export function Overview(props: {
  content?: React.ReactNode;
  groups?: Group[];
  defaultGroupTitle?: string;
  overviewHeaders?: number[];
}) {
  const {
    siteData,
    page: { routePath, title, frontmatter },
  } = usePageData();
  const {
    content,
    groups: customGroups,
    defaultGroupTitle: _ = 'Others',
  } = props;

  // Added state for search query
  const [query, setQuery] = useState('');
  // Added ref for search input
  const searchRef = useRef<HTMLInputElement>(null);

  // Added effect to focus search input on mount
  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const subFilter = (link: string) =>
    link.startsWith(routePath.replace(/overview$/, '')) &&
    !isEqualPath(link, routePath);
  const getChildLink = (
    traverseItem:
      | SidebarDivider
      | SidebarItem
      | NormalizedSidebarGroup
      | SidebarSectionHeader,
  ): string => {
    if ('link' in traverseItem && traverseItem.link) {
      return traverseItem.link;
    }
    if ('items' in traverseItem) {
      return getChildLink(traverseItem.items[0]);
    }
    return '';
  };

  const { pages } = siteData;
  const overviewModules = pages.filter(page => subFilter(page.routePath));
  let overviewSidebarGroups = useSidebar() as (
    | NormalizedSidebarGroup
    | SidebarItem
  )[];

  const {
    overview: {
      filterNameText = 'Filter',
      filterPlaceholderText = 'Enter keyword',
      filterNoResultText = 'No matching API found',
    } = {},
  } = useLocaleSiteData();

  if (overviewSidebarGroups[0]?.link !== routePath) {
    overviewSidebarGroups = findItemByRoutePath(
      overviewSidebarGroups,
      routePath,
    );
  }

  function normalizeSidebarItem(
    item:
      | SidebarItem
      | SidebarDivider
      | NormalizedSidebarGroup
      | SidebarSectionHeader,
    sidebarGroup?: NormalizedSidebarGroup,
    frontmatter?: Record<string, unknown>,
  ): GroupItem | false {
    if (isSidebarDivider(item)) {
      return false;
    }
    if (isSidebarSectionHeader(item)) {
      return false;
    }
    // do not display overview title in sub pages overview
    if (item.link === `${routePath}index` && frontmatter?.overview === true) {
      return false;
    }
    // props > frontmatter in single file > _meta.json config in a file > frontmatter in overview page > _meta.json config in sidebar
    const overviewHeaders = props?.overviewHeaders ??
      item.overviewHeaders ??
      (frontmatter?.overviewHeaders as number[]) ??
      sidebarGroup?.overviewHeaders ?? [2];
    // sidebar items link without base path
    const pageModule = overviewModules.find(m =>
      isEqualPath(m.routePath, item.link || ''),
    );
    const link = getChildLink(item);
    return {
      ...item,
      link,
      headers:
        pageModule?.toc?.filter(header =>
          overviewHeaders.some(depth => header.depth === depth),
        ) || [],
    };
  }

  const groups =
    customGroups ??
    useMemo(() => {
      const group = overviewSidebarGroups
        .filter(normalizedSidebarGroup => {
          const sidebarGroup = normalizedSidebarGroup as NormalizedSidebarGroup;
          if (Array.isArray(sidebarGroup?.items)) {
            return (
              sidebarGroup.items.filter(item => subFilter(getChildLink(item)))
                .length > 0
            );
          }
          if (
            isSidebarSingleFile(sidebarGroup) &&
            subFilter(getChildLink(sidebarGroup))
          ) {
            return true;
          }
          return false;
        })
        .map(normalizedSidebarGroup => {
          const sidebarGroup = normalizedSidebarGroup as NormalizedSidebarGroup;
          let items: GroupItem[] = [];
          if (sidebarGroup?.items) {
            items = sidebarGroup?.items
              ?.map(item =>
                normalizeSidebarItem(item, sidebarGroup, frontmatter),
              )
              .filter(Boolean) as GroupItem[];
          } else if (isSidebarSingleFile(sidebarGroup)) {
            items = [
              normalizeSidebarItem(
                {
                  link: sidebarGroup.link,
                  text: sidebarGroup.text || '',
                  tag: sidebarGroup.tag,
                  _fileKey: sidebarGroup._fileKey,
                  overviewHeaders: sidebarGroup.overviewHeaders,
                } as SidebarItem,
                undefined,
                frontmatter,
              ) as GroupItem,
            ];
          }
          return {
            name: sidebarGroup.text || '',
            items,
          };
        }) as Group[];
      return group;
    }, [overviewSidebarGroups, routePath, frontmatter]);

  // Added filtering functionality
  const filtered: Group[] = useMemo(() => {
    if (!query) return groups;

    return groups
      .map(group => {
        if (matchesQuery(group.name, query)) {
          return group;
        }

        const matchedItems = group.items
          .map(item => {
            if (matchesQuery(item.text || '', query)) {
              return item;
            }
            const matchedHeaders = item.headers?.filter(({ text }) =>
              matchesQuery(text, query),
            );
            return matchedHeaders?.length
              ? { ...item, headers: matchedHeaders }
              : null;
          })
          .filter(Boolean) as GroupItem[];

        return matchedItems.length ? { ...group, items: matchedItems } : null;
      })
      .filter(Boolean) as Group[];
  }, [groups, query]);

  const overviewTitle = title || 'Overview';

  return (
    <div className="rspress-doc rp-doc rspress-overview rp-overview">
      <FallbackHeading level={1} title={overviewTitle} />
      <OverviewSearchInput
        query={query}
        setQuery={setQuery}
        searchRef={searchRef}
        filterNameText={filterNameText}
        filterPlaceholderText={filterPlaceholderText}
      />
      {content}
      {filtered.length > 0 ? (
        filtered.map(group => <OverviewGroup key={group?.name} group={group} />)
      ) : (
        <div className="rp-overview__empty">{`${filterNoResultText}: ${query}`}</div>
      )}
    </div>
  );
}
