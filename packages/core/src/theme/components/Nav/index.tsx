import { useNav, useSite } from '@rspress/core/runtime';
import {
  NavHamburger,
  NavTitle,
  Search,
  SocialLinks,
  SwitchAppearance,
} from '@rspress/core/theme';
import { isDarkModeSwitchEnabled } from '@rspress/shared';
import './index.scss';
import { NavLangs, NavMenu, NavMenuDivider, NavVersions } from './NavMenu';

export interface NavItemsSlots {
  beforeLeftNavItems?: React.ReactNode;
  afterLeftNavItems?: React.ReactNode;
  beforeRightNavItems?: React.ReactNode;
  afterRightNavItems?: React.ReactNode;
}

export interface NavProps extends NavItemsSlots {
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
    ...navItemsSlots
  } = props;
  const navList = useNav();
  const { site } = useSite();
  const hasAppearanceSwitch = isDarkModeSwitchEnabled(
    site.themeConfig.darkMode,
  );

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        {beforeNavTitle}
        {navTitle ?? <NavTitle />}
        {/* only in desktop */}
        <NavMenu
          menuItems={navList}
          position="left"
          before={navItemsSlots.beforeLeftNavItems}
          after={navItemsSlots.afterLeftNavItems}
        />
        {afterNavTitle}
      </div>

      <div className="rp-nav__right">
        {beforeNavMenu}
        <Search />

        {/* only in desktop */}
        <NavMenu
          menuItems={navList}
          position="right"
          before={navItemsSlots.beforeRightNavItems}
          after={navItemsSlots.afterRightNavItems}
        />
        <div className="rp-nav__others">
          <NavMenuDivider />
          <NavLangs />
          <NavVersions />
          {hasAppearanceSwitch && <SwitchAppearance />}
          <SocialLinks />
        </div>

        {/* only in mobile */}
        <NavHamburger {...navItemsSlots} />
        {afterNavMenu}
      </div>
    </header>
  );
}
