import { useEffect, useState } from 'react';
import {
  inBrowser,
  normalizeSlash,
  type NormalizedSidebarGroup,
  type SidebarItem as ISidebarItem,
  type SidebarDivider as ISidebarDivider,
  type SidebarSectionHeader as ISidebarSectionHeader,
} from '@rspress/shared';
import { routes } from 'virtual-routes';
import { matchRoutes, useLocation, removeBase } from '@rspress/runtime';
import { isActive, useLocaleSiteData, useSidebarData } from '../../logic';

import { SidebarItem } from './SidebarItem';
import { NavBarTitle } from '../Nav/NavBarTitle';
import { SidebarDivider } from './SidebarDivider';
import type { UISwitchResult } from '../../logic/useUISwitch';
import { SidebarSectionHeader } from './SidebarSectionHeader';

import styles from './index.module.scss';

const isSidebarDivider = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is ISidebarDivider => {
  return 'dividerType' in item;
};

const isSidebarSectionHeader = (
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader,
): item is ISidebarSectionHeader => {
  return 'sectionHeaderText' in item;
};

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
  uiSwitch?: UISwitchResult;
}

type SidebarData = (ISidebarDivider | ISidebarItem | NormalizedSidebarGroup)[];

export const highlightTitleStyle = {
  fontSize: '14px',
  paddingLeft: '24px',
  fontWeight: 'bold',
};

export let bodyStyleOverflow: string;

// Note: the cache object won't be reassign in other module
// eslint-disable-next-line import/no-mutable-exports
export let matchCache: WeakMap<
  NormalizedSidebarGroup | ISidebarItem | ISidebarDivider,
  boolean
> = new WeakMap();

export function Sidebar(props: Props) {
  const { isSidebarOpen, beforeSidebar, afterSidebar, uiSwitch } = props;

  const { pathname: rawPathname } = useLocation();
  const { items: rawSidebarData } = useSidebarData();
  const [sidebarData, setSidebarData] = useState<SidebarData>(() => {
    return rawSidebarData.filter(Boolean).flat();
  });

  const localesData = useLocaleSiteData();
  const pathname = decodeURIComponent(rawPathname);
  const langRoutePrefix = normalizeSlash(localesData.langRoutePrefix || '');

  useEffect(() => {
    if (inBrowser) {
      if (isSidebarOpen) {
        bodyStyleOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = bodyStyleOverflow || '';
      }
    }
  }, [isSidebarOpen]);

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
  const renderItem = (
    item:
      | NormalizedSidebarGroup
      | ISidebarItem
      | ISidebarDivider
      | ISidebarSectionHeader,
    index: number,
  ) => {
    if (isSidebarDivider(item)) {
      return (
        <SidebarDivider key={index} depth={0} dividerType={item.dividerType} />
      );
    }

    if (isSidebarSectionHeader(item)) {
      return (
        <SidebarSectionHeader
          key={index}
          sectionHeaderText={item.sectionHeaderText}
          tag={item.tag}
        />
      );
    }

    return (
      <SidebarItem
        id={String(index)}
        item={item}
        depth={0}
        activeMatcher={activeMatcher}
        key={index}
        collapsed={(item as NormalizedSidebarGroup).collapsed ?? true}
        setSidebarData={setSidebarData}
        preloadLink={preloadLink}
      />
    );
  };
  return (
    <aside
      className={`${styles.sidebar} rspress-sidebar ${
        isSidebarOpen ? styles.open : ''
      }`}
    >
      {!uiSwitch.showNavbar ? null : (
        <div className={styles.navTitleMask}>
          <NavBarTitle />
        </div>
      )}
      <div className={`rspress-scrollbar ${styles.sidebarContent}`}>
        <nav className="pb-2">
          {beforeSidebar}
          {sidebarData.map(renderItem)}
          {afterSidebar}
        </nav>
      </div>
    </aside>
  );
}
