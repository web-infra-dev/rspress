import type {
  NormalizedSidebarGroup,
  SidebarDivider as SidebarDividerType,
  SidebarItem as SidebarItemType,
  SidebarSectionHeader as SidebarSectionHeaderType,
} from '@rspress/core';
import { useActiveMatcher } from '@rspress/core/runtime';
import ArrowRight from '@theme-assets/arrow-right';
import clsx from 'clsx';
import type React from 'react';
import { useCallback, useRef } from 'react';
import { useNavigate } from '../Link/useNavigate';
import { SvgWrapper } from '../SvgWrapper';
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
    <SvgWrapper icon={ArrowRight} />
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
  const navigate = useNavigate();
  const initialState = useRef('collapsed' in item && item.collapsed);
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeightRef = useRef<number>(item.items.length * 40);

  const transitionRef = useRef<number>(null);
  const active = item.link && activeMatcher(item.link);
  const { collapsed = false, collapsible = true } =
    item as NormalizedSidebarGroup;

  const handleClickCollapsedTransition = useCallback(
    (collapsed: boolean /*target value */) => {
      if (transitionRef.current) {
        clearTimeout(transitionRef.current);
      }

      const container = containerRef.current;

      if (!container) {
        return;
      }

      if (collapsed) {
        // fold
        const contentHeight = container.clientHeight;
        containerHeightRef.current = contentHeight;

        container.style.maxHeight = `${contentHeight}px`;
        container.style.opacity = '0';
        container.style.transition = 'all .2s ease-out';

        transitionRef.current = window.setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.maxHeight = '0px';
          }
        }, 200);
      } else {
        // unfold
        const contentHeight = containerHeightRef.current;
        container.style.transition = 'all .2s ease-in';
        container.style.maxHeight = `${contentHeight}px`;
        container.style.opacity = '1';

        transitionRef.current = window.setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.style.removeProperty('max-height');
          }
        }, 200);
      }
    },
    [],
  );

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
        className={clsx(
          'rp-sidebar-group',
          {
            'rp-sidebar-group--top-level': depth === 0,
          },
          className,
        )}
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
              collapsible && handleClickCollapsedTransition(!collapsed);
            });
            return;
          }
          e.stopPropagation();
          collapsible && toggleCollapse();
          collapsible && handleClickCollapsedTransition(!collapsed);
        }}
        right={collapsible && <CollapsibleIcon collapsed={collapsed} />}
      />

      <div
        ref={containerRef}
        style={{
          overflow: 'hidden',
          maxHeight: initialState.current ? '0px' : undefined,
          opacity: initialState.current ? 0 : 1,
        }}
      >
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
    </>
  );
}
