import type {
  SidebarDivider as ISidebarDivider,
  SidebarItem as ISidebarItem,
  SidebarSectionHeader as ISidebarSectionHeader,
  NormalizedSidebarGroup,
  SidebarData,
} from '@rspress/core';
import { useSidebarDynamic } from '@rspress/core/runtime';
import { useLocaleSiteData } from '@rspress/core/runtime';
import { SidebarDivider } from './SidebarDivider';
import { SidebarGroup } from './SidebarGroup';
import { SidebarItem } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from './utils';

export function Sidebar() {
  const [sidebarData, setSidebarData] = useSidebarDynamic();
  const { sidebar } = useLocaleSiteData();
  const isAccordionMode = sidebar?.accordion === true;

  return (
    <SidebarList 
      sidebarData={sidebarData} 
      setSidebarData={setSidebarData} 
      isAccordionMode={isAccordionMode}
    />
  );
}

export function SidebarList({
  sidebarData,
  setSidebarData,
  isAccordionMode,
}: {
  sidebarData: SidebarData;
  setSidebarData: React.Dispatch<React.SetStateAction<SidebarData>>;
  isAccordionMode?: boolean;
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
            isAccordionMode={isAccordionMode}
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
  isAccordionMode?: boolean;
}) {
  const { item, index, setSidebarData, isAccordionMode } = props;
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
        isAccordionMode={isAccordionMode}
      />
    );
  }

  return <SidebarItem item={item} key={index} depth={0} />;
}
