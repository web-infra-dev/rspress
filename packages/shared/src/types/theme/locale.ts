import type { Nav } from './nav';
import type { Sidebar } from './sidebar';

/**
 * locale config
 */
export type LocaleConfig = {
  /**
   * Site i18n config, which will recover the locales config in the site level.
   */
  lang: string;
  label: string;
  title?: string;
  description?: string;
  /**
   * Theme i18n config
   */
  nav?: Nav;
  sidebar?: Sidebar;
};
