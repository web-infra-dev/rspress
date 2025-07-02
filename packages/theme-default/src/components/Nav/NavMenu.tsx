import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/shared';
import { Link } from '@theme';
import {
  navMenu,
  navMenuDivider,
  navMenuItem,
  navMenuItemContainer,
  svgDown,
} from './NavMenu.module.scss';
import { SvgDown } from './SvgDown';

function NavMenuDivider() {
  return <div className={navMenuDivider}></div>;
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
  return (
    <li className={navMenuItem}>
      <Link href={menuItem.link}>
        <div className={navMenuItemContainer}>{menuItem.text}</div>
      </Link>
    </li>
  );
}

export function NavMenu({ menuItems }: { menuItems: NavItem[] }) {
  return (
    <ul className={navMenu}>
      {menuItems.map((item, index) => {
        if ('items' in item && Array.isArray(item.items)) {
          return <NavMenuItemWithChildren menuItem={item} key={index} />;
        }
        if ('link' in item) {
          return <NavMenuItem menuItem={item} key={index} />;
        }
      })}
      <NavMenuDivider />
      <NavMenuItemWithChildren menuItem={{ items: [] }} />
    </ul>
  );
}
