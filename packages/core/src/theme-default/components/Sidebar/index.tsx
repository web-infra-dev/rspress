import React, { useEffect, useState } from 'react';
import {
  NormalizedSidebarGroup,
  SidebarItem as ISidebarItem,
} from '@rspress/shared';
import { matchRoutes } from 'react-router-dom';
import { routes } from 'virtual-routes';
import { isActive } from '../../logic';
import { NavBarTitle } from '../Nav/NavBarTitle';
import styles from './index.module.scss';
import { SidebarItem } from './SidebarItem';
import { removeBase, usePageData } from '@/runtime';

export interface SidebarItemProps {
  id: string;
  item: ISidebarItem | NormalizedSidebarGroup;
  depth: number;
  activeMatcher: (link: string) => boolean;
  collapsed?: boolean;
  setSidebarData: React.Dispatch<
    React.SetStateAction<(NormalizedSidebarGroup | ISidebarItem)[]>
  >;
  preloadLink: (link: string) => void;
}

interface Props {
  isSidebarOpen?: boolean;
  pathname: string;
  langRoutePrefix: string;
  sidebarData: (NormalizedSidebarGroup | ISidebarItem)[];
}

export const highlightTitleStyle = {
  color: 'var(--rp-c-text-1)',
  fontSize: '14px',
  paddingLeft: '24px',
  fontWeight: 'bold',
};

// Note: the cache object won't be reassign in other module
// eslint-disable-next-line import/no-mutable-exports
export let matchCache: WeakMap<NormalizedSidebarGroup | ISidebarItem, boolean> =
  new WeakMap();

export function SideBar(props: Props) {
  const {
    isSidebarOpen,
    langRoutePrefix,
    pathname: rawPathname,
    sidebarData: rawSidebarData,
  } = props;
  const {
    siteData: { themeConfig },
    page: { frontmatter },
  } = usePageData();
  const hideNavbar =
    frontmatter?.hideNavbar ?? themeConfig?.hideNavbar ?? false;
  const [sidebarData, setSidebarData] = useState<
    (ISidebarItem | NormalizedSidebarGroup)[]
  >(rawSidebarData.filter(Boolean).flat());
  const pathname = decodeURIComponent(rawPathname);
  useEffect(() => {
    if (props.sidebarData === sidebarData) {
      return;
    }
    // 1. Update sidebarData when pathname changes
    // 2. For current active item, expand its parent group
    // Cache, Avoid redundant calculation
    matchCache = new WeakMap<NormalizedSidebarGroup | ISidebarItem, boolean>();
    const match = (item: NormalizedSidebarGroup | ISidebarItem) => {
      if (matchCache.has(item)) {
        return matchCache.get(item);
      }
      if (item.link && activeMatcher(item.link)) {
        matchCache.set(item, true);
        return true;
      }
      if ('items' in item) {
        const result = item.items.some(child => match(child));
        if (result) {
          matchCache.set(item, true);
          return true;
        }
      }
      matchCache.set(item, false);
      return false;
    };
    const traverse = (item: NormalizedSidebarGroup | ISidebarItem) => {
      if ('items' in item) {
        item.items.forEach(traverse);
        if (match(item)) {
          item.collapsed = false;
        }
      }
    };
    const newSidebarData = props.sidebarData.filter(Boolean).flat();
    newSidebarData.forEach(traverse);
    setSidebarData(newSidebarData);
  }, [props.sidebarData, pathname]);

  const removeLangPrefix = (path: string) => {
    return path.replace(langRoutePrefix, '');
  };
  const activeMatcher = (path: string) =>
    isActive(
      removeBase(removeLangPrefix(pathname)),
      removeLangPrefix(path),
      true,
    );
  const preloadLink = (link: string) => {
    const match = matchRoutes(routes, link);
    if (match?.length) {
      const { route } = match[0];
      route.preload();
    }
  };
  return (
    <aside
      className={`${styles.sidebar} rspress-sidebar ${
        isSidebarOpen ? styles.open : ''
      }`}
      style={{
        ...(hideNavbar ? { marginTop: 0 } : {}),
      }}
    >
      <div className={styles.navTitleMask}>
        <NavBarTitle />
      </div>
      <div className={`mt-1 ${styles.sidebarContent}`}>
        <div
          className="rspress-scrollbar"
          style={{
            maxHeight: 'calc(100vh - var(--rp-nav-height) - 8px)',
            overflow: 'scroll',
          }}
        >
          <nav className="pb-2">
            {sidebarData.map(
              (item: NormalizedSidebarGroup | ISidebarItem, index: number) => (
                <SidebarItem
                  id={String(index)}
                  item={item}
                  depth={0}
                  activeMatcher={activeMatcher}
                  // The siderbarData is stable, so it's safe to use index as key
                  // eslint-disable-next-line react/no-array-index-key
                  key={index}
                  collapsed={(item as NormalizedSidebarGroup).collapsed ?? true}
                  setSidebarData={setSidebarData}
                  preloadLink={preloadLink}
                />
              ),
            )}
          </nav>
        </div>
      </div>
    </aside>
  );
}
