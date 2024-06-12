import { useState } from 'react';
import {
  type NavItem,
  type NavItemWithChildren,
  type NavItemWithLink,
  type NavItemWithLinkAndChildren,
  withoutBase,
} from '@rspress/shared';
import Down from '@theme-assets/down';
import { Link, Tag } from '@theme';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import { SvgWrapper } from '../SvgWrapper';

export interface NavMenuGroupItem {
  text?: string | React.ReactElement;
  link?: string;
  items: NavItem[];
  tag?: string;
  // Design for i18n highlight.
  activeValue?: string;
  // Currrnt pathname.
  pathname?: string;
  // Base path.
  base?: string;
  // Locales
  langs?: string[];
}

function ActiveGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div
      key={item.link}
      className="rounded-2xl my-1 flex"
      style={{
        padding: '0.4rem 1.5rem 0.4rem 0.75rem',
      }}
    >
      {item.tag && <Tag tag={item.tag} />}
      <span className="text-brand">{item.text}</span>
    </div>
  );
}

function NormalGroupItem({ item }: { item: NavItemWithLink }) {
  return (
    <div key={item.link} className="font-medium my-1">
      <Link href={item.link}>
        <div
          className="rounded-2xl hover:bg-mute"
          style={{
            padding: '0.4rem 1.5rem 0.4rem 0.75rem',
          }}
        >
          <div className="flex">
            {item.tag && <Tag tag={item.tag} />}
            <span>{item.text}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function NavMenuGroup(item: NavMenuGroupItem) {
  const {
    activeValue,
    items: groupItems,
    base = '',
    link = '',
    pathname = '',
  } = item;
  const [isOpen, setIsOpen] = useState(false);
  const renderLinkItem = (item: NavItemWithLink) => {
    const isLinkActive = new RegExp(item.activeMatch || item.link).test(
      withoutBase(pathname, base),
    );
    if (activeValue === item.text || (!activeValue && isLinkActive)) {
      return <ActiveGroupItem key={item.link} item={item} />;
    }
    return <NormalGroupItem key={item.link} item={item} />;
  };
  const renderGroup = (
    item: NavItemWithChildren | NavItemWithLinkAndChildren,
  ) => {
    return (
      <div>
        {'link' in item ? (
          renderLinkItem(item as NavItemWithLink)
        ) : (
          <p className="font-bold text-gray-400 my-1 not:first:border">
            {item.text}
          </p>
        )}
        {item.items.map(renderLinkItem)}
      </div>
    );
  };
  return (
    <div
      className="relative flex-center h-14"
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        onMouseEnter={() => setIsOpen(true)}
        className="rspress-nav-menu-group-button flex-center items-center font-medium text-sm text-text-1 hover:text-text-2 transition-colors duration-200"
      >
        {link ? (
          // @ts-expect-error item.text may be ReactElement
          <NavMenuSingleItem {...item} rightIcon={<SvgWrapper icon={Down} />} />
        ) : (
          <>
            <span
              className="text-sm font-medium flex"
              style={{
                marginRight: '2px',
              }}
            >
              <Tag tag={item.tag} />
              {item.text}
            </span>
            <SvgWrapper icon={Down} />
          </>
        )}
      </button>
      <div
        className="rspress-nav-menu-group-content absolute mx-0.8 transition-opacity duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
          visibility: isOpen ? 'visible' : 'hidden',
          right: 0,
          top: '52px',
        }}
      >
        <div
          className="p-3 pr-2 w-full h-full max-h-100vh whitespace-nowrap"
          style={{
            boxShadow: 'var(--rp-shadow-3)',
            zIndex: 100,
            border: '1px solid var(--rp-c-divider-light)',
            borderRadius: 'var(--rp-radius-large)',
            background: 'var(--rp-c-bg)',
          }}
        >
          {/* The item could be a link or a sub group */}
          {groupItems.map(item => {
            return (
              <div key={item.text}>
                {'items' in item ? renderGroup(item) : renderLinkItem(item)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
