import { NoSSR } from '@rspress/runtime';
import type { DefaultThemeConfig, NavItem, SiteData } from '@rspress/shared';
import { SocialLinks, SwitchAppearance } from '@theme';
import { clearAllBodyScrollLocks, disableBodyScroll } from 'body-scroll-lock';
import { useEffect, useRef } from 'react';
import { base } from 'virtual-runtime-config';
import { useNavData } from '../../logic/useNav';
import {
  useTranslationMenuData,
  useVersionMenuData,
} from '../Nav/menuDataHooks';
import { NavMenuSingleItem } from '../Nav/NavMenuSingleItem';
import * as styles from './index.module.scss';
import { NavScreenMenuGroup } from './NavScreenMenuGroup';

interface Props {
  isScreenOpen: boolean;
  toggleScreen: () => void;
  siteData: SiteData<DefaultThemeConfig>;
  pathname: string;
}

const NavScreenTranslations = () => {
  const translationMenuData = useTranslationMenuData();
  return (
    <div className="rp-flex rp-text-sm rp-font-bold rp-justify-center">
      <div className="rp-mx-1.5 rp-my-1">
        <NavScreenMenuGroup {...translationMenuData} />
      </div>
    </div>
  );
};

const NavScreenVersions = () => {
  const versionMenuData = useVersionMenuData();
  return (
    <div className={'rp-flex rp-text-sm rp-font-bold rp-justify-center'}>
      <div className="rp-mx-1.5 rp-my-1">
        <NavScreenMenuGroup {...versionMenuData} />
      </div>
    </div>
  );
};

const NavScreenAppearance = () => {
  return (
    <div
      className={`rp-mt-2 ${styles.navAppearance} rp-flex rp-justify-center`}
    >
      <NoSSR>
        <SwitchAppearance />
      </NoSSR>
    </div>
  );
};

const NavScreenMenu = ({
  menuItems,
  pathname,
  base,
  langs,
  toggleScreen,
}: {
  menuItems: NavItem[];
  pathname: string;
  base: string;
  langs: string[];
  toggleScreen: () => void;
}) => {
  return (
    <div className={styles.navMenu}>
      {menuItems.map(item => {
        return (
          <div key={item.text} className={`${styles.navMenuItem} rp-w-full`}>
            {'link' in item ? (
              <NavMenuSingleItem
                pathname={pathname}
                key={item.text}
                base={base}
                langs={langs}
                onClick={toggleScreen}
                {...item}
              />
            ) : (
              <div key={item.text} className="rp-mx-3 last:rp-mr-0">
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

export function NavScreen(props: Props) {
  const { isScreenOpen, toggleScreen, siteData, pathname } = props;
  const screen = useRef<HTMLDivElement | null>(null);
  const localesData = siteData.themeConfig.locales || [];
  const hasMultiLanguage = localesData.length > 1;
  const hasMultiVersion = siteData.multiVersion.versions.length > 1;
  const menuItems = useNavData();
  const hasAppearanceSwitch = siteData.themeConfig.darkMode !== false;
  const socialLinks = siteData?.themeConfig?.socialLinks || [];
  const hasSocialLinks = socialLinks.length > 0;
  const langs = localesData.map(item => item.lang || 'zh') || [];

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
      className={`${styles.navScreen} ${isScreenOpen ? styles.active : ''} rspress-nav-screen`}
      ref={screen}
      id="navScreen"
    >
      <div className={styles.container}>
        <NavScreenMenu
          menuItems={menuItems}
          base={base}
          langs={langs}
          pathname={pathname}
          toggleScreen={toggleScreen}
        />
        <div className="rp-flex rp-items-center rp-justify-center rp-flex-col rp-gap-2">
          {hasAppearanceSwitch && <NavScreenAppearance />}
          {hasMultiLanguage && <NavScreenTranslations />}
          {hasMultiVersion && <NavScreenVersions />}
          {hasSocialLinks && <SocialLinks socialLinks={socialLinks} />}
        </div>
      </div>
    </div>
  );
}
