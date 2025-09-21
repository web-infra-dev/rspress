import { useNav } from '@rspress/runtime';
import { Search } from '@theme';
import './index.scss';
import type { NavItem } from '@rspress/shared';
import { useMemo } from 'react';
import { NavHamburger } from '../NavHamburger';
import { NavMenu, NavMenuDivider, NavMenuOthers } from './NavMenu';
import { NavTitle } from './NavTitle';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;

  beforeNavMenu?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
  afterNav?: React.ReactNode;
}

export function Nav(props: NavProps) {
  const {
    beforeNavTitle,
    afterNavTitle,
    beforeNav,
    beforeNavMenu,
    afterNavMenu,
    navTitle,
    afterNav,
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
    <>
      {beforeNav}
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
          <NavMenuDivider />
          <NavMenuOthers />

          {/* only in mobile */}
          <NavHamburger />
          {afterNavMenu}
        </div>
      </header>
      {afterNav}
    </>
  );
}
