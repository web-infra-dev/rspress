import {
  isEqualPath,
  normalizeHrefInRuntime as normalizeHref,
  usePageData,
} from '@rspress/runtime';
import type {
  Header,
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
  SidebarSectionHeader,
} from '@rspress/shared';
import { Link } from '@theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import { useSidebarData } from '../../logic/useSidebarData';
import { renderInlineMarkdown } from '../../logic/utils';
import {
  isSidebarDivider,
  isSidebarSectionHeader,
  isSidebarSingleFile,
} from '../Sidebar/utils';
import * as styles from './index.module.scss';
import { findItemByRoutePath } from './utils';

interface GroupItem {
  text: string;
  link: string;
  headers?: Header[];
}

interface Group {
  name: string;
  items: GroupItem[];
}

// Utility function to normalize text for search
const normalizeText = (s: string) => s.toLowerCase().replace(/-/g, ' ');

// Utility function to check if text matches query
const matchesQuery = (text: string, query: string) =>
  normalizeText(text).includes(normalizeText(query));

// JSX fragment for the search input
const SearchInput = ({
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
    <div className="rp-flex rp-items-center rp-justify-start rp-gap-4">
      <label htmlFor="api-filter">{filterNameText}</label>
      <input
        ref={searchRef}
        type="search"
        placeholder={filterPlaceholderText}
        id="api-filter"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="rp-border rp-border-gray-300 dark:rp-border-gray-700 rp-rounded-lg rp-px-3 rp-py-2 rp-transition-shadow rp-duration-250 rp-ease-in-out focus:rp-outline-none focus:rp-ring-2 focus:rp-ring-green-500 focus:rp-ring-opacity-50"
      />
    </div>
  );
};

// JSX fragment for rendering a group
const GroupRenderer = ({
  group,
  styles,
}: {
  group: Group;
  styles: Record<string, string>;
}) => (
  <div className="rp-mb-16" key={group.name}>
    <h2 {...renderInlineMarkdown(group.name)}></h2>
    <div className={styles.overviewGroups}>
      {group.items.map(item => (
        <div className={styles.overviewGroup} key={item.link}>
          <div className="rp-flex">
            <h3 style={{ marginBottom: 8 }}>
              <Link
                href={normalizeHref(item.link)}
                {...renderInlineMarkdown(item.text)}
              ></Link>
            </h3>
          </div>
          <ul className="rp-list-none">
            {item.headers?.map(header => (
              <li
                key={header.id}
                className={`${styles.overviewGroupLi} ${
                  styles[`level${header.depth}`]
                } first:rp-mt-2`}
              >
                <Link
                  href={`${normalizeHref(item.link)}#${header.id}`}
                  {...renderInlineMarkdown(header.text)}
                ></Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  </div>
);

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
    // sidebar items link without base path
    // pages route path with base path
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
  let overviewSidebarGroups = useSidebarData() as (
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
    <div className="overview-index rp-mx-auto">
      <div className="rp-flex rp-flex-col sm:rp-flex-row rp-items-start sm:rp-items-center rp-justify-between rp-mb-10">
        <h1 className="rp-text-3xl rp-leading-10 rp-tracking-tight">
          {overviewTitle}
        </h1>
        <SearchInput
          query={query}
          setQuery={setQuery}
          searchRef={searchRef}
          filterNameText={filterNameText}
          filterPlaceholderText={filterPlaceholderText}
        />
      </div>
      {content}
      {filtered.length > 0 ? (
        filtered.map(group => (
          <GroupRenderer key={group?.name} group={group} styles={styles} />
        ))
      ) : (
        <div className="rp-text-lg rp-text-gray-500 rp-text-center rp-mt-9 rp-pt-9 rp-border-t rp-border-gray-200 dark:rp-border-gray-800">
          {`${filterNoResultText}: ${query}`}
        </div>
      )}
    </div>
  );
}
