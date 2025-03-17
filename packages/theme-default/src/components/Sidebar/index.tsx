import { useLocation } from '@rspress/runtime';
import {
  type SidebarDivider as ISidebarDivider,
  type SidebarItem as ISidebarItem,
  type SidebarSectionHeader as ISidebarSectionHeader,
  type NormalizedSidebarGroup,
  inBrowser,
} from '@rspress/shared';
import { useEffect, useState } from 'react';

import type { UISwitchResult } from '../../logic/useUISwitch';
import { NavBarTitle } from '../Nav/NavBarTitle';
import { SidebarDivider } from './SidebarDivider';
import { SidebarItem } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';

import { useSidebarData } from '../../logic/useSidebarData';
import * as styles from './index.module.scss';
import {
  isSideBarCustomLink,
  isSidebarDivider,
  isSidebarSectionHeader,
  useActiveMatcher,
} from './utils';

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
}

interface Props {
  isSidebarOpen?: boolean;
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
  uiSwitch?: UISwitchResult;
  navTitle?: React.ReactNode;
}

export type SidebarData = (
  | ISidebarDivider
  | ISidebarItem
  | NormalizedSidebarGroup
)[];

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
  const { isSidebarOpen, beforeSidebar, afterSidebar, uiSwitch, navTitle } =
    props;

  const { pathname: rawPathname } = useLocation();
  const rawSidebarData = useSidebarData();
  const [sidebarData, setSidebarData] = useState<SidebarData>(() => {
    return rawSidebarData.filter(Boolean).flat();
  });

  const pathname = decodeURIComponent(rawPathname);

  const activeMatcher = useActiveMatcher();

  useEffect(() => {
    if (inBrowser()) {
      if (isSidebarOpen) {
        bodyStyleOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = bodyStyleOverflow || '';
      }
    }
    return () => {
      if (inBrowser()) {
        document.body.style.overflow = bodyStyleOverflow || '';
      }
    };
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

  return (
    <aside
      className={`${styles.sidebar} rspress-sidebar ${
        isSidebarOpen ? styles.open : ''
      }`}
    >
      {!uiSwitch?.showNavbar ? null : (
        <div className={styles.navTitleMask}>{navTitle || <NavBarTitle />}</div>
      )}
      <div className={`rspress-scrollbar ${styles.sidebarContent}`}>
        <nav className="pb-2">
          {beforeSidebar}
          <SidebarList
            sidebarData={sidebarData}
            setSidebarData={setSidebarData}
          />
          {afterSidebar}
        </nav>
      </div>
    </aside>
  );
}

export function SidebarList({
  sidebarData,
  setSidebarData,
}: {
  sidebarData: SidebarData;
  setSidebarData: React.Dispatch<React.SetStateAction<SidebarData>>;
}) {
  const activeMatcher = useActiveMatcher();
  return (
    <>
      {sidebarData.map((item, index) => {
        return (
          <SidebarListItem
            key={index}
            item={item}
            index={index}
            setSidebarData={setSidebarData}
            activeMatcher={activeMatcher}
          />
        );
      })}
    </>
  );
}

function SidebarListItem(props: {
  item:
    | NormalizedSidebarGroup
    | ISidebarItem
    | ISidebarDivider
    | ISidebarSectionHeader;
  index: number;
  setSidebarData: React.Dispatch<React.SetStateAction<SidebarData>>;
  activeMatcher: (link: string) => boolean;
}) {
  const { item, index, setSidebarData, activeMatcher } = props;
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

  if (isSideBarCustomLink(item)) {
    return (
      <div
        className="rspress-sidebar-item rspress-sidebar-custom-link"
        key={index}
        data-context={item.context}
      >
        <SidebarItem
          id={String(index)}
          item={item}
          depth={0}
          key={index}
          collapsed={(item as NormalizedSidebarGroup).collapsed ?? true}
          setSidebarData={setSidebarData}
          activeMatcher={activeMatcher}
        />
      </div>
    );
  }

  return (
    <SidebarItem
      id={String(index)}
      item={item}
      depth={0}
      key={index}
      activeMatcher={activeMatcher}
      collapsed={(item as NormalizedSidebarGroup).collapsed ?? true}
      setSidebarData={setSidebarData}
    />
  );
}
