import type { LocaleConfig } from './locale';
import type { NavItem } from './nav';
import type { NormalizedSidebar, Sidebar } from './sidebar';
import type { SocialLink } from './socialLink';

/**
 * Option item for LlmsViewOptions component.
 */
export type LlmsViewOption =
  | 'markdownLink'
  | 'chatgpt'
  | 'claude'
  | {
      title: string;
      icon?: React.ReactNode;
      onClick?: () => void;
    }
  | {
      title: string;
      href: string;
      icon?: React.ReactNode;
    };

/**
 * Configuration for LLMS UI components displayed on H1 headers.
 * When enabled, LlmsCopyButton and LlmsViewOptions will be automatically
 * added below H1 headers without requiring custom getCustomMDXComponent.
 * @default false
 */
export type LlmsUI =
  | {
      /**
       * Options for LlmsViewOptions component dropdown menu.
       * @default ['markdownLink', 'chatgpt', 'claude']
       */
      viewOptions?: LlmsViewOption[];
      /**
       * Where to display the LLM UI components.
       * - 'title': Show as buttons below the H1 title (default)
       * - 'outline': Show as separate rows in the outline sidebar
       * @default 'title'
       */
      placement?: 'title' | 'outline';
    }
  | boolean;

export interface EditLink {
  /**
   * Custom repository url for edit link.
   * @example 'https://github.com/web-infra-dev/rspress/tree/main/packages/document/docs'
   */
  docRepoBaseUrl: string;
}

/**
 * HomeLayout footer config
 * If you need more advanced customization, please use `rspress eject HomeFooter`
 */
export interface Footer {
  message?: string;
}

export type ThemeConfig = {
  /**
   * Whether to enable dark mode.
   * @default true
   */
  darkMode?: boolean;
  /**
   * The nav items. When it's an object, the key is the version of current doc.
   */
  nav?: NavItem[] | { [key: string]: NavItem[] };
  /**
   * The sidebar items.
   */
  sidebar?: Sidebar;
  /**
   * Info for the edit link. If it's undefined, the edit link feature will
   * be disabled.
   */
  editLink?: EditLink;
  /**
   * Whether to display the last update time of the file.
   * @default false
   */
  lastUpdated?: boolean;
  /**
   * The social links to be displayed at the end of the nav bar. Perfect for
   * placing links to social services such as GitHub, X, Facebook, etc.
   */
  socialLinks?: SocialLink[];
  /**
   * The homeLayout footer configuration.
   */
  footer?: Footer;
  /**
   * Locale config
   */
  locales?: LocaleConfig[];
  /**
   * Whether to open the full text search
   */
  search?: boolean;
  /**
   * The behavior of hiding navbar
   * Currently, Rspress V2 does not implement `hideNavBar`
   * @default 'never''
   */
  hideNavbar?: 'always' | 'auto' | 'never';
  /**
   * Whether to enable view transition animation for pages switching
   * Currently, Rspress V2 does not implement `hideNavBar`
   * @default false
   */
  enableContentAnimation?: boolean;
  /**
   * Whether to enable view transition animation for the theme
   * @default false
   */
  enableAppearanceAnimation?: boolean;
  /**
   * Enable scroll to top button on documentation
   * @default true
   */
  enableScrollToTop?: boolean;
  /**
   * Whether to redirect to the closest locale when the user visits the site
   * @default 'auto'
   */
  localeRedirect?: 'auto' | 'never' | 'only-default-lang';
  /**
   * Whether to show the fallback heading title when the heading title is not presented but `frontmatter.title` exists
   * @default true
   */
  fallbackHeadingTitle?: boolean;
  /**
   * LLMS UI components configuration.
   * When llmsUI.enableOnH1 is true, LlmsCopyButton and LlmsViewOptions
   * will be automatically added below H1 headers.
   */
  llmsUI?: LlmsUI;
};

export interface NormalizedLocales extends Omit<LocaleConfig, 'sidebar'> {
  sidebar: NormalizedSidebar;
}

export interface NormalizedThemeConfig
  extends Omit<ThemeConfig, 'locales' | 'sidebar'> {
  locales: NormalizedLocales[];
  sidebar: NormalizedSidebar;
}
