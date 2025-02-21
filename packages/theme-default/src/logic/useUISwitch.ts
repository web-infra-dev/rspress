import { useLocation, usePageData } from '@rspress/runtime';
import { inBrowser } from '@rspress/shared';
import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_NAV_HEIGHT, scrollToTarget } from './sideEffects';
import { useEnableNav, useHiddenNav } from './useHiddenNav';
import { useLocaleSiteData } from './useLocaleSiteData';

export enum QueryStatus {
  Show = '1',
  Hide = '0',
}

export interface UISwitchResult {
  showNavbar: boolean;
  showSidebar: boolean;
  showAside: boolean;
  showDocFooter: boolean;
}

export function useUISwitch(): UISwitchResult {
  const { page, siteData } = usePageData();
  const { frontmatter } = page;
  const { themeConfig } = siteData;
  const localesData = useLocaleSiteData();
  const location = useLocation();
  const isOverviewPage = frontmatter?.overview ?? false;
  const getShowAside = () => {
    // if in iframe, default value is false
    const defaultHasAside =
      typeof window === 'undefined' ? true : window.top === window.self;
    return (
      (frontmatter?.outline ?? themeConfig?.outline ?? defaultHasAside) &&
      !isOverviewPage
    );
  };
  const [showNavbar, setShowNavbar] = useEnableNav();
  const [showAside, setShowAside] = useState(getShowAside());
  const [showDocFooter, setShowDocFooter] = useState(
    (frontmatter?.footer as boolean) ?? true,
  );

  const sidebar = localesData.sidebar || {};
  // sidebar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const showSidebar =
    frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;
  useEffect(() => {
    setShowAside(getShowAside());
  }, [page, siteData]);

  // Control the display of the navbar, sidebar and aside
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const documentStyle = document.documentElement.style;
    const originalSidebarWidth =
      documentStyle.getPropertyValue('--rp-sidebar-width');
    const originalAsideWidth =
      documentStyle.getPropertyValue('--rp-aside-width');
    const originNavbar = showNavbar;
    const originDocFooter = showDocFooter;
    const navbar = query.get('navbar');
    const sidebar = query.get('sidebar');
    const aside = query.get('outline');
    const footer = query.get('footer');

    if (navbar === QueryStatus.Hide) {
      setShowNavbar(false);
    }

    if (sidebar === QueryStatus.Hide) {
      document.documentElement.style.setProperty('--rp-sidebar-width', '0px');
    }

    if (aside === QueryStatus.Hide) {
      document.documentElement.style.setProperty('--rp-aside-width', '0px');
    }

    if (footer === QueryStatus.Hide) {
      setShowDocFooter(false);
    }

    return () => {
      document.documentElement.style.setProperty(
        '--rp-sidebar-width',
        originalSidebarWidth,
      );
      document.documentElement.style.setProperty(
        '--rp-aside-width',
        originalAsideWidth,
      );
      setShowNavbar(originNavbar);
      setShowDocFooter(originDocFooter);
    };
  }, [location.search]);

  const { hash: locationHash = '', pathname } = useLocation();
  const decodedHash: string = useMemo(() => {
    return decodeURIComponent(locationHash);
  }, [locationHash]);

  // Control the scroll behavior of the browser when location hash changed
  const { hash } = useLocation();
  useEffect(() => {
    if (inBrowser() && history.scrollRestoration) {
      history.scrollRestoration = hash.length ? 'manual' : 'auto';
    }
  }, [!hash.length]);
  // why window.scrollTo(0, 0)?
  // when using history.scrollRestoration = 'auto' ref: "useUISwitch.ts", we scroll to the last page's position when navigating to nextPage
  useEffect(() => {
    if (decodedHash.length === 0) {
      window.scrollTo(0, 0);
    }
  }, [decodedHash, pathname]);

  return {
    showAside,
    showNavbar,
    showSidebar,
    showDocFooter,
  };
}
