import { useMemo } from 'react';
import type {
  Header,
  NormalizedSidebarGroup,
  SidebarItem,
  SidebarDivider,
} from '@rspress/shared';
import {
  usePageData,
  normalizeHrefInRuntime as normalizeHref,
  withBase,
  isEqualPath,
} from '@rspress/runtime';
import { renderInlineMarkdown, useSidebarData } from '../../logic';
import { Link } from '@theme';
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

// The sidebar data include two types: sidebar item and sidebar group.
// In overpage page, we select all the related sidebar groups and show the groups in the page.
// In the meantime, some sidebar items also should be shown in the page, we collect them in the group named 'Others' and show them in the page.

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
  const findItemByRoutePath = (items, routePath, originalItems) => {
    for (const item of items) {
      if (withBase(item.link) === routePath) {
        return [item];
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

  return (
    <div className="overview-index mx-auto px-8">
      <div className="flex items-center justify-between">
        {!title && (
          <h1 className="text-3xl leading-10 tracking-tight">Overview</h1>
        )}
      </div>
      {content}
      {groups.map(group => (
        <div className="mb-16" key={group.name}>
          {/* If there is no sidebar group, we show the sidebar items directly and hide the group name */}
          {group.name === defaultGroupTitle && groups.length === 1 ? (
            <h2 style={{ paddingTop: 0 }}></h2>
          ) : (
            <h2>{renderInlineMarkdown(group.name)}</h2>
          )}

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
      ))}
    </div>
  );
}
