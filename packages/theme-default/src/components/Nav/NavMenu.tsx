import { useLocation } from '@rspress/runtime';
import {
  type NavItem,
  type NavItemWithChildren,
  type NavItemWithLink,
  type NavItemWithLinkAndChildren,
  matchNavbar,
} from '@rspress/shared';
import { Link } from '@theme';
import cls from 'clsx';
import { useMemo } from 'react';
import {
  active,
  navMenu,
  navMenuDivider,
  navMenuItem,
  navMenuItemContainer,
  navMenuItemHoverAndActive,
  navMenuOthers,
  svgDown,
} from './NavMenu.module.scss';
import { useHoverGroup } from './components/useHoverGroup';
import { SvgDown } from './icons/SvgDown';

function NavMenuItemWithChildren({
  menuItem,
}: {
  menuItem: NavItemWithChildren | NavItemWithLinkAndChildren;
}) {
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

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup(
    menuItem.items,
  );

  return (
    <li
      className={cls(navMenuItem, navMenuItemHoverAndActive)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseEnter}
    >
      <div>
        <div className={cls(navMenuItemContainer)}>
          {menuItem.text}
          <SvgDown className={svgDown} />
        </div>
      </div>
      {hoverGroup}
    </li>
  );
}

function NavMenuItemWithLink({ menuItem }: { menuItem: NavItemWithLink }) {
  const { pathname } = useLocation();
  const isActive = useMemo(() => {
    return matchNavbar(menuItem, pathname);
  }, [menuItem, pathname]);

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
