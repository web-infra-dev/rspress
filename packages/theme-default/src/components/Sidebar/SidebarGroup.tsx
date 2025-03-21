import {
  normalizeHrefInRuntime as normalizeHref,
  useNavigate,
  withBase,
} from '@rspress/runtime';
import type { NormalizedSidebarGroup } from '@rspress/shared';
import { Tag } from '@theme';
import ArrowRight from '@theme-assets/arrow-right';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { type SidebarItemProps, highlightTitleStyle } from '.';
import { renderInlineMarkdown } from '../../logic/utils';
import { SvgWrapper } from '../SvgWrapper';
import { SidebarDivider } from './SidebarDivider';
import { SidebarItem as SidebarItemComp } from './SidebarItem';
import * as styles from './index.module.scss';
import { isSidebarDivider, preloadLink } from './utils';

export function SidebarGroup(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const transitionRef = useRef<number>();
  const innerRef = useRef<HTMLDivElement>(null);
  const initialRender = useRef(true);
  const initialState = useRef('collapsed' in item && item.collapsed);
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
      className="rspress-sidebar-section rp-mt-0.5 rp-block"
      data-context={item.context}
      style={{
        marginLeft: depth === 0 ? 0 : '18px',
      }}
    >
      <div
        className={`rspress-sidebar-collapse rp-flex rp-justify-between rp-items-center ${
          active ? styles.menuItemActive : styles.menuItem
        }`}
        data-context={item.context}
        // we use div instead of Link, so preloadLink manually
        onMouseEnter={() => item.link && preloadLink(item.link)}
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
          className="rp-py-2 rp-px-3 rp-text-sm rp-font-medium rp-flex"
          style={{
            ...(depth === 0 ? highlightTitleStyle : {}),
          }}
        >
          <Tag tag={item.tag} />
          <span
            className="rp-flex rp-items-center rp-justify-center"
            style={{
              fontSize: depth === 0 ? '14px' : '13px',
            }}
          >
            {renderInlineMarkdown(item.text)}
          </span>
        </h2>
        {collapsible && (
          <div
            className={`${styles.collapseContainer} rp-p-2 rp-rounded-xl`}
            onClick={toggleCollapse}
          >
            {collapsibleIcon}
          </div>
        )}
      </div>
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
            marginLeft: depth === 0 ? '12px' : 0,
          }}
        >
          {(item as NormalizedSidebarGroup)?.items?.map((item, index) =>
            isSidebarDivider(item) ? (
              <SidebarDivider
                // eslint-disable-next-line react/no-array-index-key
                key={index}
                depth={depth + 1}
                dividerType={item.dividerType}
              />
            ) : (
              // eslint-disable-next-line react/no-array-index-key
              <div
                className="rspress-sidebar-item"
                key={index}
                data-context={item.context}
              >
                <SidebarItemComp
                  {...props}
                  item={item}
                  depth={depth + 1}
                  id={`${id}-${index}`}
                />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
