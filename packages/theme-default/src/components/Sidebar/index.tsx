import { useSidebarDynamic } from '@rspress/runtime';
import {
  type SidebarDivider as ISidebarDivider,
  type SidebarItem as ISidebarItem,
  type SidebarSectionHeader as ISidebarSectionHeader,
  inBrowser,
  type NormalizedSidebarGroup,
  type SidebarData,
} from '@rspress/shared';
import { useEffect } from 'react';
import type { UISwitchResult } from '../../logic/useUISwitch';
import { NavBarTitle } from '../Nav/NavBarTitle';
import * as styles from './index.module.scss';
import { SidebarDivider } from './SidebarDivider';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from './utils';

interface Props {
  isSidebarOpen?: boolean;
  beforeSidebar?: React.ReactNode;
  afterSidebar?: React.ReactNode;
  uiSwitch?: UISwitchResult;
  navTitle?: React.ReactNode;
}

export let bodyStyleOverflow: string;

export function Sidebar(props: Props) {
  const { isSidebarOpen, beforeSidebar, afterSidebar, uiSwitch, navTitle } =
    props;

  const [sidebarData, setSidebarData] = useSidebarDynamic();

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

  return (
    <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
      {!uiSwitch?.showNavbar ? null : (
        <div className={styles.navTitleMask}>{navTitle || <NavBarTitle />}</div>
      )}
      <div className={`${styles.sidebarContainer} rspress-scrollbar`}>
        <nav>
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
  return (
    <>
      {sidebarData.map((item, index) => {
        return (
          <SidebarListItem
            key={index}
            item={item}
            index={index}
            setSidebarData={setSidebarData}
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
}) {
  const { item, index, setSidebarData } = props;
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

  if (isSidebarGroup(item)) {
    return (
      <SidebarGroup
        id={String(index)}
        key={`${item.text}-${index}`}
        item={item}
        depth={0}
        setSidebarData={setSidebarData}
      />
    );
  }

  return <SidebarItem item={item} key={index} depth={0} />;
}
