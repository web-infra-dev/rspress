import { useEffect, useState } from 'react';
import { useLocation, useVersion } from '@rspress/runtime';
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
  const { nav } = useLocaleSiteData();
  const version = useVersion();
  // Normalize the nav item links to include the version prefix
  if (Array.isArray(nav)) {
    return nav;
  }

  const navKey = version.length > 0 ? version : 'default';
  return [...nav[navKey]];
}
