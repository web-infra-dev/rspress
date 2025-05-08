import { useLocation, usePageData, useWindowSize } from '@rspress/runtime';
import type { NavItem } from '@rspress/shared';
import { Search } from '@theme';
import { useHiddenNav } from '../../logic/useHiddenNav';
import { useNavData } from '../../logic/useNav';
import { NavHamburger } from '../NavHamburger';
import { SocialLinks } from '../SocialLinks';
import { SwitchAppearance } from '../SwitchAppearance';
import { NavBarTitle } from './NavBarTitle';
import { NavMenuGroup } from './NavMenuGroup';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import { NavTranslations } from './NavTranslations';
import { NavVersions } from './NavVersions';
import * as styles from './index.module.scss';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  navTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
  afterNavMenu?: React.ReactNode;
}

const DEFAULT_NAV_POSITION = 'right';

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav, afterNavMenu, navTitle } =
    props;
  const { siteData, page } = usePageData();
  const { base } = siteData;
  const { pathname } = useLocation();
  const { width } = useWindowSize();
  const hiddenNav = useHiddenNav();
  const isMobile = width < 1280;
  const localeLanguages = Object.values(
    siteData.locales || siteData.themeConfig.locales || {},
  );
  const hasMultiLanguage = localeLanguages.length > 1;
  const hasMultiVersion = siteData.multiVersion.versions.length > 1;
  const socialLinks = siteData.themeConfig.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const langs = localeLanguages.map(item => item.lang || '') || [];

  const NavMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className="rspress-nav-menu rp-flex rp-justify-around rp-items-center rp-text-sm rp-font-bold rp-h-14">
        {menuItems.map(item => {
          return 'items' in item || Array.isArray(item) ? (
            <div key={item.text} className="rp-mx-3 last:rp-mr-0">
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
              {...item}
            />
          );
        })}
      </div>
    );
  };

  const menuItems = useNavData();

  const getPosition = (menuItem: NavItem) =>
    menuItem.position ?? DEFAULT_NAV_POSITION;
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
          <div className="rp-flex sm:rp-flex-1 rp-items-center sm:rp-pl-4 sm:rp-pr-2">
            <Search />
          </div>
        )}
        <NavMenu menuItems={rightMenuItems} />
        <div className="rp-flex rp-items-center rp-justify-center rp-flex-row">
          {hasMultiLanguage && <NavTranslations />}
          {hasMultiVersion && <NavVersions />}
          {hasAppearanceSwitch && (
            <div className="rp-mx-2">
              <SwitchAppearance />
            </div>
          )}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    );
  };

  const computeNavPosition = () => {
    // On doc page we have the menu bar that is already sticky
    if (!isMobile || !hiddenNav || page.pageType !== 'doc') {
      return styles.sticky;
    }
    return styles.relative;
  };

  return (
    <>
      {beforeNav}
      <div
        className={`${styles.navContainer} rspress-nav rp-px-6 ${
          // Only hidden when it's not mobile
          hiddenNav ? styles.hidden : ''
        } ${computeNavPosition()}`}
      >
        <div
          className={`${styles.container} rp-flex rp-justify-between rp-items-center rp-h-full`}
        >
          {beforeNavTitle}
          {navTitle || <NavBarTitle />}
          {afterNavTitle}
          <div className="rp-flex rp-flex-1 rp-justify-end rp-items-center">
            {leftNav()}
            {rightNav()}
            {afterNavMenu}
            <div className={styles.mobileNavMenu}>
              {hasSearch && <Search />}
              <NavHamburger siteData={siteData} pathname={pathname} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
