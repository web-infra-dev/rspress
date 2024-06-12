import { useEffect, useRef } from 'react';
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock';
import type { NavItem, DefaultThemeConfig } from '@rspress/shared';
import type { SiteData } from '@rspress/shared';
import { NoSSR } from '@rspress/runtime';
import { NavMenuSingleItem } from '../Nav/NavMenuSingleItem';
import { SwitchAppearance } from '../SwitchAppearance';
import { SocialLinks } from '../SocialLinks';
import {
  useTranslationMenuData,
  useVersionMenuData,
} from '../Nav/menuDataHooks';
import { NavScreenMenuGroup } from './NavScreenMenuGroup';
import styles from './index.module.scss';
import { useNavData } from '../../logic/useNav';

interface Props {
  isScreenOpen: boolean;
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

const NavScreenTranslations = () => {
  const translationMenuData = useTranslationMenuData();
  return (
    <div className="flex text-sm font-bold justify-center">
      <div className="mx-1.5 my-1">
        <NavScreenMenuGroup {...translationMenuData} />
      </div>
    </div>
  );
};

const NavScreenVersions = () => {
  const versionMenuData = useVersionMenuData();
  return (
    <div
      className={`${styles.navTranslations} flex text-sm font-bold justify-center`}
    >
      <div className="mx-1.5 my-1">
        <NavScreenMenuGroup {...versionMenuData} />
      </div>
    </div>
  );
};

export function NavScreen(props: Props) {
  const { isScreenOpen, siteData, pathname } = props;
  const screen = useRef<HTMLDivElement | null>(null);
  const localesData = siteData.themeConfig.locales || [];
  const hasMultiLanguage = localesData.length > 1;
  const hasMultiVersion = siteData.multiVersion.versions.length > 1;
  const menuItems = useNavData();
  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;
  const socialLinks = siteData?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const langs = localesData.map(item => item.lang || 'zh') || [];
  const { base } = siteData;
  const NavScreenAppearance = () => {
    return (
      <div className={`mt-2 ${styles.navAppearance} flex justify-center`}>
        <NoSSR>
          <SwitchAppearance />
        </NoSSR>
      </div>
    );
  };
  const NavScreenMenu = ({ menuItems }: { menuItems: NavItem[] }) => {
    return (
      <div className={styles.navMenu}>
        {menuItems.map(item => {
          return (
            <div key={item.text} className={`${styles.navMenuItem} w-full`}>
              {'link' in item ? (
                <NavMenuSingleItem
                  pathname={pathname}
                  key={item.text}
                  base={base}
                  langs={langs}
                  {...item}
                />
              ) : (
                <div key={item.text} className="mx-3 last:mr-0">
                  <NavScreenMenuGroup
                    {...item}
                    items={'items' in item ? item.items : item}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };
  useEffect(() => {
    screen.current &&
      isScreenOpen &&
      disableBodyScroll(screen.current, { reserveScrollBarGap: true });
    return () => {
      clearAllBodyScrollLocks();
    };
  }, [isScreenOpen]);
  return (
    <div
      className={`${styles.navScreen} ${isScreenOpen ? styles.active : ''}`}
      ref={screen}
      id="navScreen"
    >
      <div className={styles.container}>
        <NavScreenMenu menuItems={menuItems} />
        <div className="flex-center flex-col gap-2">
          {hasAppearanceSwitch && <NavScreenAppearance />}
          {hasMultiLanguage && <NavScreenTranslations />}
          {hasMultiVersion && <NavScreenVersions />}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    </div>
  );
}
