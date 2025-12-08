import type {
  NormalizedSidebarGroup,
  SidebarDivider as SidebarDividerType,
  SidebarItem as SidebarItemType,
  SidebarSectionHeader as SidebarSectionHeaderType,
} from '@rspress/core';
import { useActiveMatcher } from '@rspress/core/runtime';
import { IconArrowRight, SvgWrapper, useLinkNavigate } from '@theme';
import clsx from 'clsx';
import type React from 'react';
import { SidebarDivider } from './SidebarDivider';
import './SidebarGroup.scss';
import { SidebarItem as SidebarItemComp, SidebarItemRaw } from './SidebarItem';
import { SidebarSectionHeader } from './SidebarSectionHeader';
import {
  isSidebarDivider,
  isSidebarGroup,
  isSidebarSectionHeader,
} from './utils';

const CollapsibleIcon = ({ collapsed }: { collapsed: boolean }) => (
  <div
    style={{
      cursor: 'pointer',
      transition: 'transform 0.2s ease-out',
      transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
    }}
  >
    <SvgWrapper icon={IconArrowRight} />
  </div>
);

export interface SidebarGroupProps {
  id: string;
  item: NormalizedSidebarGroup;
  depth: number;
  className?: string;
  setSidebarData: React.Dispatch<
    React.SetStateAction<
      (
        | NormalizedSidebarGroup
        | SidebarItemType
        | SidebarDividerType
        | SidebarSectionHeaderType
      )[]
    >
  >;
}

export function SidebarGroup(props: SidebarGroupProps) {
  const activeMatcher = useActiveMatcher();
  const { item, depth, id, setSidebarData, className } = props;
  const navigate = useLinkNavigate();
  const active = item.link && activeMatcher(item.link);
  const { collapsed = false, collapsible = true } =
    item as NormalizedSidebarGroup;

  const toggleCollapse = (): void => {
    // update collapsed state
    setSidebarData(sidebarData => {
      const newSidebarData = [...sidebarData];
      const indexes = id.split('-').map(Number);
      const initialIndex = indexes.shift()!;
      const root = newSidebarData[initialIndex];
      let current = root;
      for (const index of indexes) {
        current = (current as NormalizedSidebarGroup).items[index];
      }
      if ('items' in current) {
        current.collapsed = !current.collapsed;
      }
      return newSidebarData;
    });
  };

  return (
    <>
      <SidebarItemRaw
        active={Boolean(active)}
        link={item.link}
        tag={item.tag}
        text={item.text}
        context={item.context}
        className={clsx('rp-sidebar-group', className)}
        depth={depth}
        onClick={e => {
          if (!active && item.link && !collapsed) {
            navigate(item.link);
            return;
          }
          if (item.link) {
            e.stopPropagation();
            navigate(item.link).then(() => {
              collapsible && toggleCollapse();
            });
            return;
          }
          e.stopPropagation();
          collapsible && toggleCollapse();
        }}
        right={collapsible && <CollapsibleIcon collapsed={collapsed} />}
      />

      <div
        style={{
          // Expand/collapse by animating grid-template-rows from 0fr to 1fr.
          display: 'grid',
          gridTemplateRows: collapsed ? '0fr' : '1fr',
          transition: 'grid-template-rows 0.2s ease-out',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {item.items?.map((item, index) =>
            isSidebarGroup(item) ? (
              <SidebarGroup
                id={`${id}-${index}`}
                depth={depth + 1}
                key={`${id}-${index}`}
                item={item}
                setSidebarData={setSidebarData}
                className="rp-sidebar-item--group-item"
              />
            ) : isSidebarDivider(item) ? (
              <SidebarDivider
                key={index}
                depth={depth + 1}
                dividerType={item.dividerType}
              />
            ) : isSidebarSectionHeader(item) ? (
              <SidebarSectionHeader
                sectionHeaderText={item.sectionHeaderText}
                key={index}
              />
            ) : (
              <SidebarItemComp
                key={index}
                item={item}
                depth={depth + 1}
                className="rp-sidebar-item--group-item"
              />
            ),
          )}
        </div>
      </div>
    </>
  );
}
