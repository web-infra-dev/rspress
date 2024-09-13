import type { NavItem } from '@rspress/shared';
import { useLocation, usePageData } from '@rspress/runtime';
import { Search } from '@theme';
import { useEffect, useState } from 'react';
import { isMobileDevice, useHiddenNav } from '../../logic';
import { NavHamburger } from '../NavHambmger';
import { SocialLinks } from '../SocialLinks';
import { SwitchAppearance } from '../SwitchAppearance';
import { NavMenuGroup } from './NavMenuGroup';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import styles from './index.module.scss';
import { NavBarTitle } from './NavBarTitle';
import { NavTranslations } from './NavTranslations';
import { NavVersions } from './NavVersions';
import { useNavData } from '../../logic/useNav';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

const DEFAULT_NAV_POSTION = 'right';

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav, afterNavMenu } = props;
  const { siteData } = usePageData();
  const { base } = siteData;
  const { pathname } = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const hiddenNav = useHiddenNav();
  const localeLanguages = Object.values(
    siteData.locales || siteData.themeConfig.locales || {},
  );
  const hasMultiLanguage = localeLanguages.length > 1;
  const hasMutilVersion = siteData.multiVersion.versions.length > 1;
  const socialLinks = siteData.themeConfig.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const langs = localeLanguages.map(item => item.lang || '') || [];
  const updateIsMobile = () => {
    setIsMobile(isMobileDevice());
  };
  useEffect(() => {
    window.addEventListener('resize', updateIsMobile);
    setIsMobile(isMobileDevice());
    return () => {
      window.removeEventListener('resize', updateIsMobile);
    };
  }, []);

  const NavMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className="rspress-nav-menu menu h-14">
        {menuItems.map(item => {
          return 'items' in item || Array.isArray(item) ? (
            <div key={item.text} className="mx-3 last:mr-0">
              <NavMenuGroup
                {...item}
                base={base}
                pathname={pathname}
                langs={langs}
                items={'items' in item ? item.items : item}
              />
            </div>
          ) : (
            <NavMenuSingleItem
              pathname={pathname}
              langs={langs}
              base={base}
              key={item.link}
              compact={menuItems.length > 5}
              {...item}
            />
          );
        })}
      </div>
    );
  };

  const menuItems = useNavData();

  const getPosition = (menuItem: NavItem) =>
    menuItem.position ?? DEFAULT_NAV_POSTION;
  // eslint-disable-next-line react/prop-types
  const leftMenuItems = menuItems.filter(item => getPosition(item) === 'left');
  // eslint-disable-next-line react/prop-types
  const rightMenuItems = menuItems.filter(
    item => getPosition(item) === 'right',
  );

  const hasSearch = siteData?.themeConfig?.search !== false;

  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;

  const leftNav = () => {
    return leftMenuItems.length > 0 ? (
      <div className={styles.leftNav}>
        <NavMenu menuItems={leftMenuItems} />
      </div>
    ) : null;
  };

  const rightNav = () => {
    return (
      <div className={styles.rightNav}>
        {hasSearch && (
          <div className="flex sm:flex-1 items-center sm:pl-4 sm:pr-2">
            <Search />
          </div>
        )}
        <NavMenu menuItems={rightMenuItems} />
        <div className="flex-center flex-row">
          {hasMultiLanguage && <NavTranslations />}
          {hasMutilVersion && <NavVersions />}
          {hasAppearanceSwitch && (
            <div className="mx-2">
              <SwitchAppearance />
            </div>
          )}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    );
  };
  return (
    <>
      {beforeNav}
      <div
        className={`${styles.navContainer} rspress-nav px-6 ${
          // Only hidden when it's not mobile
          hiddenNav && !isMobile ? styles.hidden : ''
        }`}
        style={{
          position: isMobile ? 'relative' : 'sticky',
        }}
      >
        <div
          className={`${styles.container} flex justify-between items-center h-full`}
        >
          {beforeNavTitle}
          <NavBarTitle />
          {afterNavTitle}
          <div className="flex flex-1 justify-end items-center">
            {leftNav()}
            {rightNav()}
            {afterNavMenu}
            <div className={styles.mobileNavMenu}>
              {isMobile && hasSearch && <Search />}
              <NavHamburger siteData={siteData} pathname={pathname} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
