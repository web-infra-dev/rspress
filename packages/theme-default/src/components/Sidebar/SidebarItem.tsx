import { normalizeHrefInRuntime as normalizeHref } from '@rspress/runtime';
import { Link, Tag } from '@theme';
import { useEffect, useRef } from 'react';
import { type SidebarItemProps, highlightTitleStyle } from '.';
import { renderInlineMarkdown } from '../../logic/utils';
import { SidebarGroup } from './SidebarGroup';
import * as styles from './index.module.scss';

export function SidebarItem(props: SidebarItemProps) {
  const { item, depth = 0, activeMatcher, id, setSidebarData } = props;

  const active = 'link' in item && item.link && activeMatcher(item.link);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        block: 'center',
      });
    }
  }, []);

  if ('items' in item) {
    return (
      <SidebarGroup
        id={id}
        activeMatcher={activeMatcher}
        key={`${item.text}-${id}`}
        item={item}
        depth={depth}
        collapsed={item.collapsed}
        setSidebarData={setSidebarData}
      />
    );
  }

  // add the div.rspress-sidebar-item in an unified place
  return (
    <LinkContextContainer
      context={item.context}
      className={props.contextContainerClassName}
    >
      <Link
        // {...(depth === 0 ? { 'data-context': item.context } : {})}
        href={normalizeHref(item.link)}
        className={styles.menuLink}
      >
        <div
          ref={ref}
          className={`${
            active
              ? `${styles.menuItemActive} rspress-sidebar-item-active`
              : styles.menuItem
          } rp-mt-0.5 rp-py-2 rp-px-3 rp-font-medium rp-flex`}
          style={{
            // The first level menu item will have the same font size as the sidebar group
            fontSize: depth === 0 ? '14px' : '13px',
            marginLeft: depth === 0 ? 0 : '18px',
            borderRadius: '0 var(--rp-radius) var(--rp-radius) 0',
            ...(depth === 0 ? highlightTitleStyle : {}),
          }}
        >
          <Tag tag={item.tag} />
          <span>{renderInlineMarkdown(item.text)}</span>
        </div>
      </Link>
    </LinkContextContainer>
  );
}

/**
 * A container component for sidebar link items that conditionally wraps its children
 * with a <div> element, adding contextual data and custom class names as needed.
 *
 * This design helps maintain sidebar structure stability and minimizes disruption to historical tests
 * and user code.
 *
 * @param props - The component props.
 * @param props.context - Optional context string to be added as a `data-context` attribute.
 * @param props.className - Optional additional class name(s) for the container div.
 * @param props.children - The content to be rendered inside the container.
 */
function LinkContextContainer(
  props: React.PropsWithChildren<{ context?: string; className?: string }>,
) {
  return (
    <div
      className={['rspress-sidebar-item', props.className]
        .filter(Boolean)
        .join(' ')}
      {...(props.context ? { 'data-context': props.context } : {})}
    >
      {props.children}
    </div>
  );
}
