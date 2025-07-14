import { useLocation } from '@rspress/runtime';
import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/shared';
import { Link } from '@theme';
import {
  active,
  navMenu,
  navMenuDivider,
  navMenuItem,
  navMenuItemContainer,
  navMenuItemHoverAndActive,
  // navMenuItemLink,
  navMenuOthers,
  svgDown,
} from './NavMenu.module.scss';
import { SvgDown } from './icons/SvgDown';

function cls(...args: string[]) {
  return Array.from(args).filter(Boolean).join(' ');
}

function NavMenuItemWithChildren({
  menuItem,
}: { menuItem: NavItemWithChildren | NavItemWithLinkAndChildren }) {
  if ('link' in menuItem) {
    return (
      <li className={cls(navMenuItem, navMenuItemHoverAndActive)}>
        <Link href={menuItem.link}>
          <div className={navMenuItemContainer}>
            {menuItem.text}
            <SvgDown className={svgDown} />
          </div>
        </Link>
      </li>
    );
  }
  return (
    <li className={cls(navMenuItem, navMenuItemHoverAndActive)}>
      <div className={navMenuItemHoverAndActive}>
        <div className={cls(navMenuItemContainer)}>
          {menuItem.text}
          <SvgDown className={svgDown} />
        </div>
      </div>
    </li>
  );
}

function NavMenuItemWithLink({ menuItem }: { menuItem: NavItemWithLink }) {
  const { pathname } = useLocation();
  const isActive = new RegExp(menuItem.activeMatch || menuItem.link).test(
    pathname,
  );

  return (
    <li
      className={cls(
        navMenuItem,
        navMenuItemHoverAndActive,
        isActive ? active : '',
      )}
    >
      <Link href={menuItem.link}>
        <div className={navMenuItemContainer}>{menuItem.text}</div>
      </Link>
    </li>
  );
}

function NavMenuItem({ menuItem: item }: { menuItem: NavItem }) {
  if ('items' in item && Array.isArray(item.items)) {
    return <NavMenuItemWithChildren menuItem={item} />;
  }

  return <NavMenuItemWithLink menuItem={item as NavItemWithLink} />;
}

function NavMenuDivider() {
  return <div className={navMenuDivider}></div>;
}

export function NavMenu({ menuItems }: { menuItems: NavItem[] }) {
  return (
    <>
      <ul className={navMenu}>
        {menuItems.map((item, index) => {
          return <NavMenuItem key={index} menuItem={item} />;
        })}
      </ul>
      <ul className={navMenuOthers}>
        <NavMenuDivider />
        <NavMenuItem menuItem={{ items: [] }} />
      </ul>
    </>
  );
}
