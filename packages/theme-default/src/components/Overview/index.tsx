import {
  isEqualPath,
  normalizeHrefInRuntime as normalizeHref,
  usePageData,
  withBase,
} from '@rspress/runtime';
import type {
  Header,
  NormalizedSidebarGroup,
  SidebarDivider,
  SidebarItem,
} from '@rspress/shared';
import { Link } from '@theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  renderInlineMarkdown,
  useSidebarData,
  useLocaleSiteData,
} from '../../logic';
import styles from './index.module.scss';

interface GroupItem {
  text?: string;
  link?: string;
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
}) => {
  return (
    <div className="flex items-center justify-start gap-4">
      <label htmlFor="api-filter">{filterNameText}</label>
      <input
        ref={searchRef}
        type="search"
        placeholder={filterPlaceholderText}
        id="api-filter"
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 transition-shadow duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
      />
    </div>
  );
};

// JSX fragment for rendering a group
const GroupRenderer = ({ group, styles }) => (
  <div className="mb-16" key={group.name}>
    <h2>{renderInlineMarkdown(group.name)}</h2>
    <div className={styles.overviewGroups}>
      {group.items.map(item => (
        <div className={styles.overviewGroup} key={item.link}>
          <div className="flex">
            <h3 style={{ marginBottom: 8 }}>
              <Link href={normalizeHref(item.link)}>
                {renderInlineMarkdown(item.text)}
              </Link>
            </h3>
          </div>
          <ul className="list-none">
            {item.headers?.map(header => (
              <li
                key={header.id}
                className={`${styles.overviewGroupLi} ${
                  styles[`level${header.depth}`]
                } first:mt-2`}
              >
                <Link href={`${normalizeHref(item.link)}#${header.id}`}>
                  {renderInlineMarkdown(header.text)}
                </Link>
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
  const { content, groups: customGroups, defaultGroupTitle = 'Others' } = props;
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
    withBase(link).startsWith(routePath.replace(/overview$/, '')) &&
    !isEqualPath(withBase(link), routePath);
  const getChildLink = (
    traverseItem: SidebarDivider | SidebarItem | NormalizedSidebarGroup,
  ): string => {
    if ('link' in traverseItem && traverseItem.link) {
      return traverseItem.link;
    }
    if ('items' in traverseItem) {
      return getChildLink(traverseItem.items[0]);
    }
    return '';
  };

  const removeIndex = (link: string) => {
    if (link.endsWith('/index')) {
      return link.slice(0, -5);
    }
    return link;
  };

  const findItemByRoutePath = (items, routePath, originalItems) => {
    for (const item of items) {
      if (withBase(item.link) === routePath) {
        return [item];
      }

      if (removeIndex(withBase(item.link)) === routePath) {
        return items;
      }

      if (item.items) {
        const foundItem = findItemByRoutePath(
          item.items,
          routePath,
          originalItems,
        );
        if (foundItem) {
          return foundItem;
        }
      }
    }
    return originalItems;
  };
  const { pages } = siteData;
  const overviewModules = pages.filter(page => subFilter(page.routePath));
  let { items: overviewSidebarGroups } = useSidebarData() as {
    items: (NormalizedSidebarGroup | SidebarItem)[];
  };

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
      overviewSidebarGroups,
    );
  }

  function normalizeSidebarItem(
    item: SidebarItem | SidebarDivider | NormalizedSidebarGroup,
    sidebarGroup?: NormalizedSidebarGroup,
    frontmatter?: Record<string, unknown>,
  ) {
    if ('dividerType' in item) {
      return item;
    }
    // do not display overview title in sub pages overview
    if (
      withBase(item.link) === `${routePath}index` &&
      frontmatter?.overview === true
    ) {
      return false;
    }
    // props > frontmatter in single file > _meta.json config in a file > frontmatter in overview page > _meta.json config in sidebar
    const overviewHeaders = props?.overviewHeaders ??
      item.overviewHeaders ??
      (frontmatter?.overviewHeaders as number[]) ??
      sidebarGroup?.overviewHeaders ?? [2];
    // sidebar items link without base path
    const pageModule = overviewModules.find(m =>
      isEqualPath(m.routePath, withBase(item.link || '')),
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

  const isSingleFile = (item: SidebarItem | NormalizedSidebarGroup) =>
    !('items' in item) && 'link' in item;

  const groups =
    customGroups ??
    useMemo(() => {
      const group = overviewSidebarGroups
        .filter(sidebarGroup => {
          if ('items' in sidebarGroup && sidebarGroup.items) {
            return (
              sidebarGroup.items.filter(item => subFilter(getChildLink(item)))
                .length > 0
            );
          }
          if (
            isSingleFile(sidebarGroup) &&
            subFilter(getChildLink(sidebarGroup))
          ) {
            return true;
          }
          return false;
        })
        .map(sidebarGroup => {
          let items = [];
          if ((sidebarGroup as NormalizedSidebarGroup)?.items) {
            items = (sidebarGroup as NormalizedSidebarGroup)?.items
              ?.map(item =>
                normalizeSidebarItem(
                  item,
                  sidebarGroup as NormalizedSidebarGroup,
                  frontmatter,
                ),
              )
              .filter(Boolean);
          } else if (isSingleFile(sidebarGroup)) {
            items = [
              normalizeSidebarItem(
                {
                  link: sidebarGroup.link,
                  text: sidebarGroup.text || '',
                  tag: sidebarGroup.tag,
                  _fileKey: sidebarGroup._fileKey,
                  overviewHeaders: sidebarGroup.overviewHeaders,
                },
                undefined,
                frontmatter,
              ),
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
  const filtered = useMemo(() => {
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
          .filter(Boolean);

        return matchedItems.length ? { ...group, items: matchedItems } : null;
      })
      .filter(Boolean);
  }, [groups, query]);

  const overviewTitle = title || 'Overview';

  return (
    <div className="overview-index mx-auto px-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10">
        <h1 className="text-3xl leading-10 tracking-tight">{overviewTitle}</h1>
        {/* Added search input */}
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
          <GroupRenderer key={group.name} group={group} styles={styles} />
        ))
      ) : (
        <div className="text-lg text-gray-500 text-center mt-9 pt-9 border-t border-gray-200 dark:border-gray-800">
          {`${filterNoResultText}: ${query}`}
        </div>
      )}
    </div>
  );
}
