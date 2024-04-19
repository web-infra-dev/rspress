import { useEffect, useState } from 'react';
import { useLocation, usePageData } from '@rspress/runtime';
import { useLocaleSiteData } from './useLocaleSiteData';

export function useNavScreen() {
  const { pathname } = useLocation();
  const [isScreenOpen, setIsScreenOpen] = useState(false);

  function openScreen() {
    setIsScreenOpen(true);
    window.addEventListener('resize', closeScreenOnTabletWindow);
  }

  function closeScreen() {
    setIsScreenOpen(false);
    window.removeEventListener('resize', closeScreenOnTabletWindow);
  }

  function toggleScreen() {
    if (isScreenOpen) {
      closeScreen();
    } else {
      openScreen();
    }
  }

  useEffect(() => {
    closeScreen();
  }, [pathname]);

  /**
   * Close screen when the user resizes the window wider than tablet size.
   */
  function closeScreenOnTabletWindow() {
    window.outerWidth >= 768 && closeScreen();
  }

  return {
    isScreenOpen,
    openScreen,
    closeScreen,
    toggleScreen,
  };
}

export function useNavData() {
  const { siteData, page } = usePageData();
  const defaultVersion = siteData.multiVersion.default;
  const currentVersion = page.version;

  const { nav } = useLocaleSiteData();

  if (Array.isArray(nav)) {
    return nav;
  }

  const navKey = currentVersion || defaultVersion || 'default';
  return [...nav[navKey]];
}
