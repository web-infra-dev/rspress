import { useEffect, useState } from 'react';
import { useLocation, usePageData } from '@rspress/runtime';
import { useEnableNav } from './useHiddenNav';
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
  const [originNavbar] = useEnableNav();
  const [showNavbar, setShowNavbar] = useState(originNavbar);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAside, setShowAside] = useState(getShowAside());
  const [showDocFooter, setShowDocFooter] = useState(
    (frontmatter?.footer as boolean) ?? true,
  );

  // Recalculate the display of navbar, sidebar, aside and doc footer
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    // check display of navbar
    const queryNavbar = query.get('navbar');
    setShowNavbar(
      [originNavbar, queryNavbar !== QueryStatus.Hide].every(Boolean),
    );

    // check display of sidebar
    // siderbar Priority
    // 1. url query
    // 2. frontmatter.sidebar
    // 3. themeConfig.locales.sidebar
    // 4. themeConfig.sidebar
    const sidebar = localesData.sidebar || {};
    const showSidebar =
      frontmatter?.sidebar !== false && Object.keys(sidebar).length > 0;
    const querySidebar = query.get('sidebar');
    setShowSidebar(
      [showSidebar, querySidebar !== QueryStatus.Hide].every(Boolean),
    );

    // check display of aside
    const queryAside = query.get('outline');
    setShowAside(
      [getShowAside(), queryAside !== QueryStatus.Hide].every(Boolean),
    );

    // check display of doc footer
    const queryFooter = query.get('footer');
    setShowDocFooter(
      [
        (frontmatter?.footer as boolean) ?? true,
        queryFooter !== QueryStatus.Hide,
      ].every(Boolean),
    );
  }, [originNavbar, localesData, frontmatter, location.search]);

  // Control the display of the navbar, sidebar and aside
  useEffect(() => {
    if (showSidebar) {
      document.documentElement.style.removeProperty('--rp-sidebar-width');
    } else {
      document.documentElement.style.setProperty('--rp-sidebar-width', '0px');
    }

    if (showAside) {
      document.documentElement.style.removeProperty('--rp-aside-width');
    } else {
      document.documentElement.style.setProperty('--rp-aside-width', '0px');
    }
  }, [showSidebar, showAside]);

  return {
    showAside,
    showNavbar,
    showSidebar,
    showDocFooter,
  };
}
