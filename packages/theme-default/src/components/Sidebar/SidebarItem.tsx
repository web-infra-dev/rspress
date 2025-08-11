import type {
  NormalizedSidebarGroup,
  SidebarItem as SidebarItemType,
} from '@rspress/shared';
import { Link, Tag } from '@theme';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { renderInlineMarkdown } from '../../logic/utils';
import * as styles from './SidebarItem.module.scss';

export function SidebarItemRaw({
  active,
  text,
  tag,
  link,
  context,
  className,
  left,
  right,
  onClick,
  depth = 0,
}: {
  className?: string;
  active: boolean;
  text: string;
  tag: SidebarItemType['tag'];
  link: string | undefined;
  context?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLDivElement | HTMLAnchorElement>;
  depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        block: 'center',
      });
    }
  }, []);

  const innerContent = (
    <>
      <div className={styles.menuItemLeft} ref={ref}>
        <span {...renderInlineMarkdown(text)}></span>
        {left}
      </div>
      <div className={styles.menuItemRight}>
        <Tag tag={tag} />
        {right}
      </div>
    </>
  );

  if (link) {
    return (
      <Link
        href={link}
        onClick={onClick}
        className={clsx(
          'rspress-sidebar-item',
          styles.menuItem,
          {
            [styles.active]: active,
            ['rspress-sidebar-item-active']: active,
          },
          className,
        )}
        style={{
          paddingLeft: depth === 0 ? 0 : `calc(12px * ${depth})`,
        }}
        {...{ 'data-depth': depth }}
        {...(context ? { 'data-context': context } : {})}
      >
        {innerContent}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={clsx(
        'rspress-sidebar-item',
        styles.menuItem,
        {
          [styles.active]: active,
          ['rspress-sidebar-item-active']: active,
        },
        className,
      )}
      {...{ 'data-depth': depth }}
      {...(context ? { 'data-context': context } : {})}
      onClick={onClick}
    >
      {innerContent}
    </div>
  );
}

export interface SidebarItemProps {
  item: SidebarItemType | NormalizedSidebarGroup;
  activeMatcher: (link: string) => boolean;
  depth: number;
  className?: string;
}

export function SidebarItem(props: SidebarItemProps) {
  const { item, activeMatcher, depth, className } = props;

  const active = Boolean(
    'link' in item && item.link && activeMatcher(item.link),
  );

  // add the div.rspress-sidebar-item in an unified place
  return (
    <SidebarItemRaw
      className={className}
      active={active}
      link={item.link}
      tag={item.tag}
      text={item.text}
      context={item.context}
      depth={depth}
    />
  );
}
