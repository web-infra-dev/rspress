export interface Config {
  /**
   * Whether to enable dark mode.
   * @default true
   */
  darkMode?: boolean;
  /**
   * Custom outline title in the aside component.
   *
   * @default 'ON THIS PAGE'
   */
  outlineTitle?: string;
  /**
   * Whether to show the sidebar in right position.
   */
  outline?: boolean;
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
   * Set custom last updated text.
   *
   * @default 'Last updated'
   */
  lastUpdatedText?: string;
  /**
   * Set custom last updated text.
   *
   * @default false
   */
  lastUpdated?: boolean;
  /**
   * Set custom prev/next labels.
   */
  docFooter?: DocFooter;

  /**
   * The social links to be displayed at the end of the nav bar. Perfect for
   * placing links to social services such as GitHub, Twitter, Facebook, etc.
   */
  socialLinks?: SocialLink[];

  /**
   * The footer configuration.
   */
  footer?: Footer;
  /**
   * The prev page text.
   */
  prevPageText?: string;
  /**
   * The next page text.
   */
  nextPageText?: string;
  /**
   * The source code text.
   */
  sourceCodeText?: string;
  /**
   * Locale config
   */
  locales?: LocaleConfig[];
  /**
   * Whether to open the full text search
   */
  search?: boolean;
  /**
   * The placeholder of search input
   */
  searchPlaceholderText?: string;
  /**
   * The behavior of hiding navbar
   */
  hideNavbar?: 'always' | 'auto' | 'never';
  /**
   * Whether to enable the animation for translation pages
   */
  enableContentAnimation?: boolean;
  /**
   * Enable scroll to top button on documentation
   * @default false
   */
  enableScrollToTop?: boolean;
  /**
   * Whether to redirect to the closest locale when the user visits the site
   * @default 'auto'
   */
  localeRedirect?: 'auto' | 'never';
}

/**
 * locale config
 */
export interface LocaleConfig {
  /**
   * Site i18n config, which will recover the locales config in the site level.
   */
  lang: string;
  title?: string;
  description?: string;
  label: string;
  /**
   * Theme i18n config
   */
  nav?: Nav;
  sidebar?: Sidebar;
  outlineTitle?: string;
  lastUpdatedText?: string;
  lastUpdated?: boolean;
  editLink?: EditLink;
  prevPageText?: string;
  nextPageText?: string;
  sourceCodeText?: string;
  langRoutePrefix?: string;
  searchPlaceholderText?: string;
}
// nav -----------------------------------------------------------------------
export type Nav = NavItem[] | { [key: string]: NavItem[] };

// TODO combine below nav item types into one
export type NavItem =
  | NavItemWithLink
  | NavItemWithChildren
  | NavItemWithLinkAndChildren;

export type NavItemWithLink = {
  text: string;
  link: string;
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
};

export interface NavItemWithChildren {
  text?: string;
  tag?: string;
  items: NavItemWithLink[];
  position?: 'left' | 'right';
}

export interface NavItemWithLinkAndChildren {
  text: string;
  link: string;
  items: NavItemWithLink[];
  tag?: string;
  activeMatch?: string;
  position?: 'left' | 'right';
}

// image -----------------------------------------------------------------------
export type Image = string | { src: string; alt?: string };

// sidebar -------------------------------------------------------------------
export interface Sidebar {
  [path: string]: (
    | SidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader
  )[];
}

export interface SidebarGroup {
  text: string;
  link?: string;
  tag?: string;
  items: (SidebarItem | SidebarDivider | SidebarGroup | string)[];
  collapsible?: boolean;
  collapsed?: boolean;
  /**
   * For hmr usage in development
   */
  _fileKey?: string;
  overviewHeaders?: number[];
}

export type SidebarItem = {
  text: string;
  link: string;
  tag?: string;
  /**
   * For hmr usage in development
   */
  _fileKey?: string;
  overviewHeaders?: number[];
};

export type SidebarDivider = { dividerType: 'dashed' | 'solid' };

export type SidebarSectionHeader = {
  sectionHeaderText: string;
  tag?: string;
};

// edit link -----------------------------------------------------------------

export interface EditLink {
  /**
   * Custom repository url for edit link.
   */
  docRepoBaseUrl: string;

  /**
   * Custom text for edit link.
   *
   * @default 'Edit this page'
   */
  text?: string;
}

// prev-next -----------------------------------------------------------------

export interface DocFooter {
  /**
   * Custom label for previous page button.
   */
  prev?: SidebarItem;

  /**
   * Custom label for next page button.
   */
  next?: SidebarItem;
}

// social link ---------------------------------------------------------------

export interface SocialLink {
  icon: SocialLinkIcon;
  mode: 'link' | 'text' | 'img' | 'dom';
  content: string;
}

export type SocialLinkIcon =
  | 'lark'
  | 'discord'
  | 'facebook'
  | 'github'
  | 'instagram'
  | 'linkedin'
  | 'slack'
  | 'twitter'
  | 'youtube'
  | 'wechat'
  | 'qq'
  | 'juejin'
  | 'zhihu'
  | 'bilibili'
  | 'weibo'
  | 'gitlab'
  | 'X'
  | { svg: string };

// footer --------------------------------------------------------------------

export interface Footer {
  message?: string;
}

// locales -------------------------------------------------------------------

export interface LocaleLinks {
  text: string;
  items: LocaleLink[];
}

export interface LocaleLink {
  text: string;
  link: string;
}

// normalized config ---------------------------------------------------------
export interface NormalizedSidebarGroup extends Omit<SidebarGroup, 'items'> {
  items: (SidebarDivider | SidebarItem | NormalizedSidebarGroup)[];
  collapsible: boolean;
  collapsed: boolean;
}
export interface NormalizedSidebar {
  [path: string]: (NormalizedSidebarGroup | SidebarItem | SidebarDivider)[];
}
export interface NormalizedLocales extends Omit<LocaleConfig, 'sidebar'> {
  sidebar: NormalizedSidebar;
}

export interface NormalizedConfig extends Omit<Config, 'locales' | 'sidebar'> {
  locales: NormalizedLocales[];
  sidebar: NormalizedSidebar;
}
