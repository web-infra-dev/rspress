import { useLocation } from '@rspress/runtime';
import {
  matchNavbar,
  type NavItem,
  type NavItemWithChildren,
  type NavItemWithLink,
  type NavItemWithLinkAndChildren,
} from '@rspress/shared';
import type { HoverGroupProps } from '@theme';
import { Link, SocialLinks, SwitchAppearance, useHoverGroup } from '@theme';
import cls from 'clsx';
import { useMemo } from 'react';
import { useLangsMenu, useVersionMenu } from './hooks';
import './NavMenu.scss';
import ArrowDown from '@theme-assets/arrow-down';
import SmallMenu from '@theme-assets/small-menu';
import { SvgWrapper } from '../SvgWrapper';

const SvgDown = (props: React.SVGProps<SVGSVGElement>) => {
  return <SvgWrapper icon={ArrowDown} {...props} />;
};

function NavMenuItemWithChildren({
  menuItem,
  activeMatcher,
}: {
  menuItem: NavItemWithChildren | NavItemWithLinkAndChildren;
  activeMatcher?: HoverGroupProps['activeMatcher'];
}) {
  if ('link' in menuItem) {
    return (
      <li className="rp-nav-menu__item">
        <Link href={menuItem.link} className="rp-nav-menu__item__container">
          {menuItem.text}
          <SvgDown className="rp-nav-menu__item__icon" />
        </Link>
      </li>
    );
  }

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    items: menuItem.items,
    activeMatcher,
  });

  return (
    <li
      className="rp-nav-menu__item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleMouseEnter}
    >
      <div className="rp-nav-menu__item__container">
        {menuItem.text}
        <SvgDown className="rp-nav-menu__item__icon" />
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
        'rp-nav-menu__item',
        isActive ? 'rp-nav-menu__item--active' : '',

        // For algolia crawler compatibility
        'rspress-nav-menu-item',
        isActive ? 'rspress-nav-menu-item-active' : '',
      )}
    >
      <Link href={menuItem.link}>
        <div className="rp-nav-menu__item__container">{menuItem.text}</div>
      </Link>
    </li>
  );
}

function NavMenuItem({ menuItem: item }: { menuItem: NavItem }) {
  if ('items' in item && Array.isArray(item.items) && item.items.length > 0) {
    return <NavMenuItemWithChildren menuItem={item} />;
  }

  return <NavMenuItemWithLink menuItem={item as NavItemWithLink} />;
}

export function NavMenuDivider() {
  return <div className="rp-nav-menu__divider"></div>;
}

function NavLangs() {
  const { items, activeValue } = useLangsMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ text: activeValue, items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}

function NavVersions() {
  const { activeValue, items } = useVersionMenu();

  return items.length > 1 ? (
    <NavMenuItemWithChildren
      menuItem={{ items }}
      activeMatcher={item => item.text === activeValue}
    />
  ) : null;
}

export function NavMenu({ menuItems }: { menuItems: NavItem[] }) {
  return (
    <ul className="rp-nav-menu">
      {menuItems.map((item, index) => {
        return <NavMenuItem key={index} menuItem={item} />;
      })}
    </ul>
  );
}

export function NavMenuOthers() {
  const items = (
    <>
      <NavLangs />
      <NavVersions />
      <SwitchAppearance />
      <SocialLinks />
    </>
  );

  const { handleMouseEnter, handleMouseLeave, hoverGroup } = useHoverGroup({
    position: 'right',
    customChildren: (
      <div className="rp-nav-menu__others-mobile__container">{items}</div>
    ),
  });
  return (
    <>
      <ul className="rp-nav-menu__others">{items}</ul>
      <div
        className="rp-nav-menu__others-mobile"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleMouseEnter}
      >
        <SvgWrapper icon={SmallMenu} fill="currentColor" />
        {hoverGroup}
      </div>
    </>
  );
}
