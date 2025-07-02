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
  navMenuItemLink,
  navMenuOthers,
  svgDown,
} from './NavMenu.module.scss';
import { SvgDown } from './SvgDown';

function NavMenuDivider() {
  return <div className={navMenuDivider}></div>;
}

function cls(...args: string[]) {
  return Array.from(args).filter(Boolean).join(' ');
}

function NavMenuItemWithChildren({
  menuItem,
}: { menuItem: NavItemWithChildren | NavItemWithLinkAndChildren }) {
  if ('link' in menuItem) {
    return (
      <li className={navMenuItem}>
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
    <li className={navMenuItem}>
      <div className={navMenuItemContainer}>
        {menuItem.text}
        <SvgDown className={svgDown} />
      </div>
    </li>
  );
}

function NavMenuItem({ menuItem }: { menuItem: NavItemWithLink }) {
  const { pathname } = useLocation();
  const isActive = new RegExp(menuItem.activeMatch || menuItem.link).test(
    pathname,
  );

  return (
    <li className={cls(navMenuItem, navMenuItemLink)}>
      <Link
        href={menuItem.link}
        className={cls(navMenuItemLink, isActive ? active : '')}
      >
        <div className={navMenuItemContainer}>{menuItem.text}</div>
      </Link>
    </li>
  );
}

export function NavMenu({ menuItems }: { menuItems: NavItem[] }) {
  return (
    <>
      <ul className={navMenu}>
        {menuItems.map((item, index) => {
          if ('items' in item && Array.isArray(item.items)) {
            return <NavMenuItemWithChildren menuItem={item} key={index} />;
          }
          if ('link' in item) {
            return <NavMenuItem menuItem={item} key={index} />;
          }
        })}
      </ul>
      <ul className={navMenuOthers}>
        <NavMenuDivider />
        <NavMenuItemWithChildren menuItem={{ items: [] }} />
      </ul>
    </>
  );
}
