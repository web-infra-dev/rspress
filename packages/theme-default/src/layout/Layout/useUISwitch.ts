import { createContext, useContext } from 'react';

export interface UISwitchResult {
  showNavbar: boolean;
  showSidebar: boolean;
  showSidebarMenu: boolean;
  showAside: boolean;
  showDocFooter: boolean;
}

export const UISwitchContext = createContext({} as UISwitchResult);

export function useUISwitch(): UISwitchResult {
  const context = useContext(UISwitchContext);
  return context;
}

export function useCreateUISwitch(): UISwitchResult {
  // sidebar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar

  return {
    showNavbar: true,
    showSidebar: true,
    showSidebarMenu: true,
    showAside: true,
    showDocFooter: true,
  };
}
