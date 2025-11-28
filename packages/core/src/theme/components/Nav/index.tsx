import { useNav } from '@rspress/core/runtime';
import { NavHamburger, Search, SocialLinks, SwitchAppearance } from '@theme';
import './index.scss';
import { PREFIX } from '../../constant';
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
    <header className={`${PREFIX}nav`}>
      <div className={`${PREFIX}nav__left`}>
        {beforeNavTitle}
        {navTitle ?? <NavTitle />}
        {/* only in desktop */}
        <NavMenu menuItems={navList} position="left" />
        {afterNavTitle}
      </div>

      <div className={`${PREFIX}nav__right`}>
        {beforeNavMenu}
        <Search />

        {/* only in desktop */}
        <NavMenu menuItems={navList} position="right" />
        <div className={`${PREFIX}nav__others`}>
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
