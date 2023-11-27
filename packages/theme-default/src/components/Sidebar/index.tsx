import React, { useEffect, useState } from 'react';
import {
  NormalizedSidebarGroup,
  SidebarItem as ISidebarItem,
  SidebarDivider as ISidebarDivider,
  normalizeSlash,
} from '@rspress/shared';
import { routes } from 'virtual-routes';
import { matchRoutes, useLocation, removeBase } from '@rspress/runtime';
import {
  isActive,
  useDisableNav,
  useLocaleSiteData,
  useSidebarData,
} from '../../logic';
import { NavBarTitle } from '../Nav/NavBarTitle';
import styles from './index.module.scss';
import { SidebarItem } from './SidebarItem';
import { SidebarDivider } from './SidebarDivider';

export interface SidebarItemProps {
  id: string;
  item: ISidebarItem | NormalizedSidebarGroup;
  depth: number;
  activeMatcher: (link: string) => boolean;
  collapsed?: boolean;
  setSidebarData: React.Dispatch<
    React.SetStateAction<
      (NormalizedSidebarGroup | ISidebarItem | ISidebarDivider)[]
    >
  >;
  preloadLink: (link: string) => void;
}

interface Props {
  isSidebarOpen?: boolean;
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
}

export const highlightTitleStyle = {
  color: 'var(--rp-c-text-1)',
  fontSize: '14px',
  paddingLeft: '24px',
  fontWeight: 'bold',
};

// Note: the cache object won't be reassign in other module
// eslint-disable-next-line import/no-mutable-exports
export let matchCache: WeakMap<
  NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
  boolean
> = new WeakMap();

export function SideBar(props: Props) {
  const { isSidebarOpen, beforeSidebar, afterSidebar } = props;
  const { items: rawSidebarData } = useSidebarData();
  const localesData = useLocaleSiteData();
  const { pathname: rawPathname } = useLocation();

  const langRoutePrefix = normalizeSlash(localesData.langRoutePrefix || '');
  const [hideNavbar] = useDisableNav();
  const [sidebarData, setSidebarData] = useState<
    (ISidebarDivider | ISidebarItem | NormalizedSidebarGroup)[]
  >(rawSidebarData.filter(Boolean).flat());
  const pathname = decodeURIComponent(rawPathname);
  useEffect(() => {
    if (rawSidebarData === sidebarData) {
      return;
    }
    // 1. Update sidebarData when pathname changes
    // 2. For current active item, expand its parent group
    // Cache, Avoid redundant calculation
    matchCache = new WeakMap<
      NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
      boolean
    >();
    const match = (
      item: NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
    ) => {
      if (matchCache.has(item)) {
        return matchCache.get(item);
      }
      if ('link' in item && item.link && activeMatcher(item.link)) {
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
    const traverse = (
      item: NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
    ) => {
      if ('items' in item) {
        item.items.forEach(traverse);
        if (match(item)) {
          item.collapsed = false;
        }
      }
    };
    const newSidebarData = rawSidebarData.filter(Boolean).flat();
    newSidebarData.forEach(traverse);
    setSidebarData(newSidebarData);
  }, [rawSidebarData, pathname]);

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
    >
      {hideNavbar ? null : (
        <div className={styles.navTitleMask}>
          <NavBarTitle />
        </div>
      )}
      <div className={`mt-1 ${styles.sidebarContent}`}>
        <div
          className="rspress-scrollbar"
          style={{
            maxHeight: 'calc(100vh - var(--rp-nav-height) - 8px)',
            overflow: 'auto',
          }}
        >
          {beforeSidebar}
          <nav className="pb-2">
            {sidebarData.map(
              (
                item: NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
                index: number,
              ) =>
                'dividerType' in item ? (
                  <SidebarDivider
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    depth={0}
                    dividerType={item.dividerType}
                  />
                ) : (
                  <SidebarItem
                    id={String(index)}
                    item={item}
                    depth={0}
                    activeMatcher={activeMatcher}
                    // The siderbarData is stable, so it's safe to use index as key
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    collapsed={
                      (item as NormalizedSidebarGroup).collapsed ?? true
                    }
                    setSidebarData={setSidebarData}
                    preloadLink={preloadLink}
                  />
                ),
            )}
          </nav>
          {afterSidebar}
        </div>
      </div>
    </aside>
  );
}
