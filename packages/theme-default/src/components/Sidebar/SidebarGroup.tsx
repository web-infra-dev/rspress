import type React from 'react';
import { useEffect, useRef } from 'react';
import { type NormalizedSidebarGroup, SidebarItem } from '@rspress/shared';
import {
  useNavigate,
  normalizeHrefInRuntime as normalizeHref,
  withBase,
} from '@rspress/runtime';
import ArrowRight from '@theme-assets/arrow-right';
import { Tag } from '@theme';
import styles from './index.module.scss';
import { SidebarItem as SidebarItemComp } from './SidebarItem';
import { SidebarDivider } from './SidebarDivider';
import { highlightTitleStyle, type SidebarItemProps } from '.';
import { SvgWrapper } from '../SvgWrapper';
import { renderInlineMarkdown } from '../../logic';

export function SidebarGroup(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<any>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  const initialState = useRef((item as NormalizedSidebarGroup).collapsed);
  const active = item.link && activeMatcher(item.link);
  const { collapsed, collapsible = true } = item as NormalizedSidebarGroup;
  const collapsibleIcon = (
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

      transitionRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.maxHeight = '0px';
        }
      }, 0);
    } else {
      container.style.maxHeight = `${contentHeight}px`;
      container.style.transitionDuration = '0.3s';
      inner.style.opacity = '1';

      transitionRef.current = setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.removeProperty('max-height');
        }
      }, 300);
    }
  }, [collapsed]);

  useEffect(() => {
    initialRender.current = false;
  }, []);

  const toggleCollapse: React.MouseEventHandler<HTMLDivElement> = (e): void => {
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
    <section
      key={id}
      className="mt-0.5 block"
      data-context={item.context}
      style={{
        marginLeft: depth === 0 ? 0 : '18px',
      }}
    >
      <div
        className={`flex justify-between items-center ${
          active ? styles.menuItemActive : styles.menuItem
        }`}
        onMouseEnter={() => item.link && props.preloadLink(item.link)}
        onClick={e => {
          if (item.link) {
            navigate(withBase(normalizeHref(item.link)));
          }
          collapsible && toggleCollapse(e);
        }}
        style={{
          borderRadius:
            depth === 0 ? '0 var(--rp-radius) var(--rp-radius) 0' : undefined,
          cursor: collapsible || item.link ? 'pointer' : 'normal',
        }}
      >
        <h2
          className="py-2 px-3 text-sm font-medium flex"
          style={{
            ...(depth === 0 ? highlightTitleStyle : {}),
          }}
        >
          <Tag tag={item.tag} />
          <span
            className="flex-center"
            style={{
              fontSize: depth === 0 ? '14px' : '13px',
            }}
          >
            {renderInlineMarkdown(item.text)}
          </span>
        </h2>
        {collapsible && (
          <div
            className={`${styles.collapseContainer} p-2 rounded-xl`}
            onClick={toggleCollapse}
          >
            {collapsibleIcon}
          </div>
        )}
      </div>
      <div
        ref={containerRef}
        className="transition-all duration-300 ease-in-out"
        style={{
          overflow: 'hidden',
          maxHeight: initialState.current ? 0 : undefined,
        }}
      >
        <div
          ref={innerRef}
          className="rspress-sidebar-group transition-opacity duration-500 ease-in-out"
          style={{
            opacity: initialState.current ? 0 : 1,
            marginLeft: depth === 0 ? '12px' : 0,
          }}
        >
          {(item as NormalizedSidebarGroup)?.items?.map((item, index) =>
            'dividerType' in item ? (
              <SidebarDivider
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                depth={depth + 1}
                dividerType={item.dividerType}
              />
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <div key={index} data-context={item.context}>
                <SidebarItemComp
                  {...props}
                  item={item}
                  depth={depth + 1}
                  id={`${id}-${index}`}
                  preloadLink={props.preloadLink}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
