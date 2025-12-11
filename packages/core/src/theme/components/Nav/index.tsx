import { useNav } from '@rspress/core/runtime';
import { NavHamburger, Search, SocialLinks, SwitchAppearance } from '@theme';
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

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        {beforeNavTitle}
        {navTitle ?? <NavTitle />}
        {/* only in desktop */}
        <NavMenu menuItems={navList} position="left" />
        {afterNavTitle}
      </div>

      <div className="rp-nav__right">
        {beforeNavMenu}
        <Search />

        {/* only in desktop */}
        <NavMenu menuItems={navList} position="right" />
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
