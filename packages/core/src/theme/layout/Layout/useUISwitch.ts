import { useFrontmatter } from '@rspress/core/runtime';
import { createContext, useContext } from 'react';

export interface UISwitchResult {
  showNavbar: boolean;
  showSidebar: boolean;
  showSidebarMenu: boolean;
  showOutline: boolean;
  showDocFooter: boolean;
}

export const UISwitchContext = createContext({} as UISwitchResult);

export function useUISwitch(): UISwitchResult {
  const context = useContext(UISwitchContext);
  return context;
}

/**
 * Control whether or not to display the navbar, sidebar, outline and footer
 * `props.uiSwitch` has higher priority and allows user to override the default value
 */
export function useCreateUISwitch(): UISwitchResult {
  // sidebar Priority
  // 1. frontmatter.sidebar
  // 2. themeConfig.locales.sidebar
  // 3. themeConfig.sidebar
  const { frontmatter } = useFrontmatter();
  const { sidebar, navbar, outline, footer } = frontmatter;

  return {
    showNavbar: navbar ?? true,
    showSidebar: sidebar ?? true,
    showSidebarMenu: true,
    showOutline: outline ?? true,
    showDocFooter: footer ?? true,
  };
}
