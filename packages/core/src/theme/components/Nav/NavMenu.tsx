import type {
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from '@rspress/core';
import { matchNavbar, useLocation } from '@rspress/core/runtime';
import type { HoverGroupProps } from '@theme';
import { IconArrowDown, Link, SvgWrapper, Tag, useHoverGroup } from '@theme';
import cls from 'clsx';
import { useMemo } from 'react';
import { useLangsMenu, useVersionsMenu } from './hooks';
import './NavMenu.scss';
import clsx from 'clsx';

export const SvgDown = (props: React.SVGProps<SVGSVGElement>) => {
  return <SvgWrapper icon={IconArrowDown} {...props} />;
};

export function NavMenuItemWithChildren({
  menuItem,
  activeMatcher,
}: {
  menuItem: NavItemWithChildren | NavItemWithLinkAndChildren;
  activeMatcher?: HoverGroupProps['activeMatcher'];
}) {
  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    items: menuItem.items,
    activeMatcher,
  });

  const inner =
    'link' in menuItem && typeof menuItem.link === 'string' ? (
      <Link href={menuItem.link} className="rp-nav-menu__item__container">
        {menuItem.text}
        {menuItem.tag && <Tag tag={menuItem.tag} />}
        <SvgDown className="rp-nav-menu__item__icon" />
      </Link>
    ) : (
      <div className="rp-nav-menu__item__container">
        {menuItem.text}
        {menuItem.tag && <Tag tag={menuItem.tag} />}
        <SvgDown className="rp-nav-menu__item__icon" />
      </div>
    );

  return menuItem.items.length > 0 ? (
    <li
      className="rp-nav-menu__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseEnter}
    >
      {inner}
      {hoverGroup}
    </li>
  ) : (
    <li className="rp-nav-menu__item">{inner}</li>
  );
}

export function NavMenuItemWithLink({
  menuItem,
}: {
  menuItem: NavItemWithLink;
}) {
  const { pathname } = useLocation();
  const isActive = useMemo(() => {
    return matchNavbar(menuItem, pathname);
  }, [menuItem, pathname]);

  return (
    <li
      className={cls(
        'rp-nav-menu__item',
        isActive ? 'rp-nav-menu__item--active' : '',

        // For algolia crawler compatibility
        'rspress-nav-menu-item',
        isActive ? 'rspress-nav-menu-item-active' : '',
      )}
    >
      <Link href={menuItem.link} className="rp-nav-menu__item__container">
        {menuItem.text}
        {menuItem.tag && <Tag tag={menuItem.tag} />}
      </Link>
    </li>
  );
}

export function NavMenuItem({ menuItem: item }: { menuItem: NavItem }) {
  if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
    return <NavMenuItemWithChildren menuItem={item} />;
  }

  return <NavMenuItemWithLink menuItem={item as NavItemWithLink} />;
}

export function NavMenuDivider() {
  return <div className="rp-nav-menu__divider"></div>;
}

export function NavLangs() {
  const { items, activeValue } = useLangsMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ text: activeValue, items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}

export function NavVersions() {
  const { activeValue, items } = useVersionsMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ text: activeValue, items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}

export function NavMenu({
  menuItems,
  position,
}: {
  menuItems: NavItem[];
  position: 'left' | 'right';
}) {
  const getPosition = (menuItem: NavItem) => menuItem.position ?? 'right';

  const leftOrRightMenuItems = useMemo(() => {
    return menuItems.filter(item => getPosition(item) === position);
  }, [menuItems]);

  if (leftOrRightMenuItems.length === 0) {
    return null;
  }

  return (
    <ul className={clsx('rp-nav-menu', `rp-nav-menu--${position}`)}>
      {leftOrRightMenuItems.map((item, index) => {
        return <NavMenuItem key={index} menuItem={item} />;
      })}
    </ul>
  );
}
