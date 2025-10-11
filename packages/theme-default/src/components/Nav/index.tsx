import { useNav } from '@rspress/runtime';
import type { NavItem } from '@rspress/shared';
import { Search, SocialLinks, SwitchAppearance } from '@theme';
import { useMemo } from 'react';
import { NavHamburger } from '../NavHamburger';
import './index.scss';
import { NavLangs, NavMenu, NavMenuDivider, NavVersions } from './NavMenu';
import { NavTitle } from './NavTitle';

export interface NavProps {
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;

  beforeNavMenu?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

export function Nav(props: NavProps) {
  const {
    beforeNavTitle,
    afterNavTitle,
    beforeNavMenu,
    afterNavMenu,
    navTitle,
  } = props;
  const navList = useNav();
  const getPosition = (menuItem: NavItem) => menuItem.position ?? 'right';

  const leftMenu = useMemo(() => {
    return navList.filter(item => getPosition(item) === 'left');
  }, [navList]);
  const rightMenu = useMemo(() => {
    return navList.filter(item => getPosition(item) === 'right');
  }, [navList]);

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        {beforeNavTitle}
        {navTitle ?? <NavTitle />}
        {/* only in desktop */}
        <NavMenu menuItems={leftMenu} />
        {afterNavTitle}
      </div>

      <div className="rp-nav__right">
        {beforeNavMenu}
        <Search />

        {/* only in desktop */}
        <NavMenu menuItems={rightMenu} />
        <div className="rp-nav__others">
          <NavMenuDivider />
          <NavLangs />
          <NavVersions />
          <SwitchAppearance />
          <SocialLinks />
        </div>

        {/* only in mobile */}
        <NavHamburger />
        {afterNavMenu}
      </div>
    </header>
  );
}
