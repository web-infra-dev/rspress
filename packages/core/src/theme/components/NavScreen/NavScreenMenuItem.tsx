import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/core';
import { matchNavbar, useLocation } from '@rspress/core/runtime';
import { IconArrowDown, Link, SvgWrapper, Tag } from '@theme';
import clsx from 'clsx';
import type React from 'react';
import { useMemo, useState } from 'react';
import './NavScreenMenuItem.scss';

interface NavScreenMenuItemWithLinkProps {
  menuItem: NavItemWithLink;
}

export const SvgDown = (props: React.SVGProps<SVGSVGElement>) => {
  return <SvgWrapper icon={IconArrowDown} {...props} />;
};

export function NavScreenMenuItemRaw({
  left,
  right,
  isOpen,
  isActive,
  onClick,
  href,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  isOpen?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  if (href) {
    return (
      <Link
        href={href}
        className={clsx(
          'rp-nav-screen-menu-item',
          isActive && 'rp-nav-screen-menu-item--active',
        )}
        onClick={onClick}
      >
        <div className="rp-nav-screen-menu-item__left">{left}</div>
        <div className="rp-nav-screen-menu-item__right">{right}</div>
      </Link>
    );
  }

  return (
    <div
      className={clsx(
        'rp-nav-screen-menu-item',
        isOpen && 'rp-nav-screen-menu-item--open',
        isActive && 'rp-nav-screen-menu-item--active',
      )}
      onClick={onClick}
    >
      <div className="rp-nav-screen-menu-item__left">{left}</div>
      <div className="rp-nav-screen-menu-item__right">{right}</div>
    </div>
  );
}

export function NavScreenMenuItemWithLink({
  menuItem,
}: NavScreenMenuItemWithLinkProps) {
  const { pathname } = useLocation();
  const isActive = useMemo(() => {
    return matchNavbar(menuItem, pathname);
  }, [menuItem, pathname]);

  return (
    <NavScreenMenuItemRaw
      left={
        <>
          {menuItem.text}
          {menuItem.tag && <Tag tag={menuItem.tag} />}
        </>
      }
      right={null}
      href={menuItem.link}
      isActive={isActive}
    />
  );
}

interface NavScreenMenuItemWithChildrenProps {
  menuItem: NavItemWithChildren | NavItemWithLinkAndChildren;
}

export function NavScreenMenuItemWithChildren({
  menuItem,
}: NavScreenMenuItemWithChildrenProps) {
  const [isOpen, setIsOpen] = useState(false);

  return menuItem.items?.length > 0 ? (
    <>
      <NavScreenMenuItemRaw
        left={
          <>
            {menuItem.text}
            {menuItem.tag && <Tag tag={menuItem.tag} />}
          </>
        }
        right={<SvgDown className="rp-nav-screen-menu-item__icon" />}
        isOpen={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      />

      <div
        className="rp-nav-screen-menu-item__group"
        style={{
          display: 'grid',
          gridTemplateRows: isOpen ? '1fr' : '0fr',
          transition: 'grid-template-rows .2s ease-out',
          width: '100%',
        }}
      >
        <div className="rp-nav-screen-menu-item__group-inner">
          {menuItem.items.map(item => (
            <NavScreenMenuItemWithChildren
              key={item.text}
              menuItem={item as any}
            />
          ))}
        </div>
      </div>
    </>
  ) : (
    <NavScreenMenuItemWithLink menuItem={menuItem as NavItemWithLink} />
  );
}

interface NavScreenMenuItemProps {
  menuItem: NavItem;
}

export function NavScreenMenuItem({ menuItem: item }: NavScreenMenuItemProps) {
  if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
    return <NavScreenMenuItemWithChildren menuItem={item} />;
  }

  return <NavScreenMenuItemWithLink menuItem={item as NavItemWithLink} />;
}
