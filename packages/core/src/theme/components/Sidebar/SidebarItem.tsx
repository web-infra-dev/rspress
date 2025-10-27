import type {
  NormalizedSidebarGroup,
  SidebarItem as SidebarItemType,
} from '@rspress/core';
import { useActiveMatcher } from '@rspress/runtime';
import { Link, Tag } from '@theme';
import clsx from 'clsx';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { renderInlineMarkdown } from '../../logic/utils';
import './SidebarItem.scss';

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
  depth,
}: {
  className?: string;
  active: boolean;
  text: string;
  tag: SidebarItemType['tag'];
  link: string | undefined;
  depth: number;
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

  const innerContent = (
    <>
      <div className="rp-sidebar-item__left" ref={ref}>
        <span {...renderInlineMarkdown(text)}></span>
        {left}
      </div>
      <div className="rp-sidebar-item__right">
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
          'rp-sidebar-item',
          {
            'rp-sidebar-item--active': active,
          },
          className,
        )}
        style={{
          // paddingLeft: depth <= 1 ? '12px' : `calc(12px * ${depth - 1} + 12px)`, // TODO: discussion
          paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
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
        'rp-sidebar-item',
        {
          'rp-sidebar-item--active': active,
        },
        className,
      )}
      style={{
        paddingLeft: depth === 0 ? '12px' : `calc(12px * ${depth} + 12px)`,
        // paddingLeft: depth <= 1 ? '12px' : `calc(12px * ${depth - 1} + 12px)`, // TODO: discussion
      }}
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
  depth: number;
  className?: string;
}

export function SidebarItem(props: SidebarItemProps) {
  const { item, depth, className } = props;
  const activeMatcher = useActiveMatcher();

  const active = Boolean(
    'link' in item && item.link && activeMatcher(item.link),
  );

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
