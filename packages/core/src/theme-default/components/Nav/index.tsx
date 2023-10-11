import { NavItem, replaceLang } from '@rspress/shared';
import { useLocation } from 'react-router-dom';
import { Search } from '@theme';
import { useEffect, useState } from 'react';
import { isMobileDevice, useHiddenNav, useLocaleSiteData } from '../../logic';
import { NavHamburger } from '../NavHambmger';
import { SocialLinks } from '../SocialLinks';
import { SwitchAppearance } from '../SwitchAppearance';
import { NavMenuGroup, NavMenuGroupItem } from './NavMenuGroup';
import { NavMenuSingleItem } from './NavMenuSingleItem';
import styles from './index.module.scss';
import { NavBarTitle } from './NavBarTitle';
import { usePageData, useVersion } from '@/runtime';

export interface NavProps {
  beforeNav?: React.ReactNode;
  beforeNavTitle?: React.ReactNode;
  afterNavTitle?: React.ReactNode;
}

const DEFAULT_NAV_POSTION = 'right';

const NavTranslations = ({
  translationMenuData,
}: {
  translationMenuData: NavMenuGroupItem;
}) => {
  return (
    <div
      className={`translation ${styles.menuItem} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} isTranslation />
      </div>
    </div>
  );
};

export function Nav(props: NavProps) {
  const { beforeNavTitle, afterNavTitle, beforeNav } = props;
  const { siteData, page } = usePageData();
  const { base } = siteData;
  const { pathname } = useLocation();
  const localeData = useLocaleSiteData();
  const currentVersion = useVersion();
  const [isMobile, setIsMobile] = useState(false);
  const hiddenNav = useHiddenNav();
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const hasMultiLanguage = localeLanguages.length > 1;
  const socialLinks = siteData.themeConfig.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const defaultLang = siteData.lang || '';
  const defaultVersion = siteData.multiVersion.default || '';
  const { lang } = page;
  const langs = localeLanguages.map(item => item.lang || '') || [];

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => ({
          text: item?.label,
          link: replaceLang(
            pathname,
            {
              current: lang,
              target: item.lang,
              default: defaultLang,
            },
            {
              current: currentVersion,
              default: defaultVersion,
            },
            base,
          ),
        })),
        activeValue: localeLanguages.find(item => lang === item.lang)?.label,
      }
    : null;

  useEffect(() => {
    setIsMobile(isMobileDevice());
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
              {...item}
            />
          );
        })}
      </div>
    );
  };

  const menuItems = localeData.nav || [];

  const getPosition = (menuItem: NavItem) =>
    menuItem.position ?? DEFAULT_NAV_POSTION;
  const leftMenuItems = menuItems.filter(item => getPosition(item) === 'left');
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
          {hasMultiLanguage && (
            <NavTranslations translationMenuData={translationMenuData} />
          )}
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
        className={`${styles.navContainer} sticky rspress-nav px-6 ${
          hiddenNav ? styles.hidden : ''
        }`}
      >
        <div
          className={`${styles.container} flex justify-between items-center h-full`}
        >
          {beforeNavTitle}
          <NavBarTitle />
          {afterNavTitle}
          <div
            className={`${styles.content} flex flex-1 justify-end items-center`}
          >
            {leftNav()}
            {rightNav()}

            <div className={styles.mobileNavMenu}>
              {isMobile && <Search />}
              <NavHamburger
                localeData={localeData}
                siteData={siteData}
                pathname={pathname}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
