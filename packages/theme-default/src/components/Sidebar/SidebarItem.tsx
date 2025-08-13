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
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        block: 'center',
      });
    }
  }, []);

  if (link) {
    return (
      <Link
        href={link}
        onClick={onClick}
        className={clsx('rspress-sidebar-item', styles.menuItem, className, {
          [styles.active]: active,
          ['rspress-sidebar-item-active']: active,
        })}
        {...(context ? { 'data-context': context } : {})}
      >
        <div className={styles.menuItemLeft} ref={ref}>
          <span {...renderInlineMarkdown(text)}></span>
          {left}
        </div>
        <div className={styles.menuItemRight}>
          <Tag tag={tag} />
          {right}
        </div>
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={clsx('rspress-sidebar-item', styles.menuItem, className, {
        [styles.active]: active,
        ['rspress-sidebar-item-active']: active,
      })}
      {...(context ? { 'data-context': context } : {})}
      onClick={onClick}
    >
      <div className={styles.menuItemLeft} ref={ref}>
        <span {...renderInlineMarkdown(text)}></span>
        <Tag tag={tag} />
      </div>
      <div className={styles.menuItemRight}></div>
    </div>
  );
}

export interface SidebarItemProps {
  item: SidebarItemType | NormalizedSidebarGroup;
  activeMatcher: (link: string) => boolean;
}

export function SidebarItem(props: SidebarItemProps) {
  const { item, activeMatcher } = props;

  const active = Boolean(
    'link' in item && item.link && activeMatcher(item.link),
  );

  // add the div.rspress-sidebar-item in an unified place
  return (
    <SidebarItemRaw
      active={active}
      link={item.link}
      tag={item.tag}
      text={item.text}
      context={item.context}
    />
  );
}
