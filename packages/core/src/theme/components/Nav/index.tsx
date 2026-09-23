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
    beforeLeftNavItems,
    afterLeftNavItems,
    beforeRightNavItems,
    afterRightNavItems,
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
          beforeNavItems={beforeLeftNavItems}
          afterNavItems={afterLeftNavItems}
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
          beforeNavItems={beforeRightNavItems}
          afterNavItems={afterRightNavItems}
        />
        <div className="rp-nav__others">
          <NavMenuDivider />
          <NavLangs />
          <NavVersions />
          {hasAppearanceSwitch && <SwitchAppearance />}
          <SocialLinks />
        </div>

        {/* only in mobile */}
        <NavHamburger
          beforeLeftNavItems={beforeLeftNavItems}
          afterLeftNavItems={afterLeftNavItems}
          beforeRightNavItems={beforeRightNavItems}
          afterRightNavItems={afterRightNavItems}
        />
        {afterNavMenu}
      </div>
    </header>
  );
}
