import type {
  NormalizedSidebarGroup,
  SidebarDivider as SidebarDividerType,
  SidebarItem as SidebarItemType,
  SidebarSectionHeader as SidebarSectionHeaderType,
} from '@rspress/shared';
import ArrowRight from '@theme-assets/arrow-right';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { SvgWrapper } from '../SvgWrapper';
import { SidebarDivider } from './SidebarDivider';
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
  item: SidebarItemType | NormalizedSidebarGroup;
  depth: number;
  activeMatcher: (link: string) => boolean;
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
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<number>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  const initialState = useRef('collapsed' in item && item.collapsed);
  const active = item.link && activeMatcher(item.link);
  const { collapsed = false, collapsible = true } =
    item as NormalizedSidebarGroup;

  useEffect(() => {
    if (initialRender.current) {
      return;
    }

    if (!containerRef.current || !innerRef.current) {
      return;
    }

    if (transitionRef.current) {
      clearTimeout(transitionRef.current);
    }

    const container = containerRef.current;
    const inner = innerRef.current;
    // We should add the margin-top(4px) of first item in list, which is a part of the height of the container
    const contentHeight = inner.clientHeight + 4;
    if (collapsed) {
      container.style.maxHeight = `${contentHeight}px`;
      container.style.transitionDuration = '0.5s';
      inner.style.opacity = '0';

      transitionRef.current = window.setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.maxHeight = '0px';
        }
      }, 0);
    } else {
      container.style.maxHeight = `${contentHeight}px`;
      container.style.transitionDuration = '0.3s';
      inner.style.opacity = '1';

      transitionRef.current = window.setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.removeProperty('max-height');
        }
      }, 300);
    }
  }, [collapsed]);

  useEffect(() => {
    initialRender.current = false;
  }, []);

  const toggleCollapse: React.MouseEventHandler<
    HTMLDivElement | HTMLAnchorElement
  > = (e): void => {
    e.stopPropagation();
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
    <section key={id} className="rspress-sidebar-section rp-mt-0.5 rp-block">
      <SidebarItemRaw
        active={Boolean(active)}
        link={item.link}
        tag={item.tag}
        text={item.text}
        context={item.context}
        onClick={e => {
          collapsible && toggleCollapse(e);
        }}
        right={collapsible && <CollapsibleIcon collapsed={collapsed} />}
      />

      <div
        ref={containerRef}
        className="rp-transition-all rp-duration-300 rp-ease-in-out"
        style={{
          overflow: 'hidden',
          maxHeight: initialState.current ? 0 : undefined,
        }}
      >
        <div
          ref={innerRef}
          className="rspress-sidebar-group rp-transition-opacity rp-duration-500 rp-ease-in-out"
          style={{
            opacity: initialState.current ? 0 : 1,
            // marginLeft: depth === 0 ? '12px' : 0,
          }}
        >
          {(item as NormalizedSidebarGroup)?.items?.map((item, index) =>
            isSidebarGroup(item) ? (
              <SidebarGroup
                id={`${id}-${index}`}
                depth={depth + 1}
                key={index}
                item={item}
                activeMatcher={activeMatcher}
                setSidebarData={setSidebarData}
              />
            ) : isSidebarDivider(item) ? (
              <SidebarDivider
                // eslint-disable-next-line react/no-array-index-key
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
              // eslint-disable-next-line react/no-array-index-key
              <SidebarItemComp
                key={index}
                item={item}
                activeMatcher={activeMatcher}
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}
