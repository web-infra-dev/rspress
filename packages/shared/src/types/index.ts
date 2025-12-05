import type { loadConfig, RsbuildConfig } from '@rsbuild/core';
import type { RehypeShikiOptions } from '@shikijs/rehype';
import type { ZoomOptions } from 'medium-zoom';
import type { PluggableList } from 'unified';
import type { AdditionalPage, RspressPlugin } from './Plugin';
import type {
  ThemeConfig as DefaultThemeConfig,
  NormalizedThemeConfig as NormalizedDefaultThemeConfig,
} from './theme';
import type { I18nText } from './theme/i18nText';

// #region theme
export type { DefaultThemeConfig, NormalizedDefaultThemeConfig };

export type { I18nText } from './theme/i18nText';
export type {
  EditLink,
  Footer,
  NormalizedLocales,
  NormalizedThemeConfig,
  ThemeConfig,
} from './theme/index';
export type { LocaleConfig } from './theme/locale';
export type {
  Nav,
  NavItem,
  NavItemWithChildren,
  NavItemWithLink,
  NavItemWithLinkAndChildren,
} from './theme/nav';
export type {
  NormalizedSidebar,
  NormalizedSidebarGroup,
  Sidebar,
  SidebarData,
  SidebarDivider,
  SidebarGroup,
  SidebarItem,
  SidebarSectionHeader,
} from './theme/sidebar';
export type { SocialLink } from './theme/socialLink';
// #endregion

export type { RspressPlugin, AdditionalPage, RspressPlugin as Plugin };

export interface Route {
  path: string;
  element: React.ReactElement;
  filePath: string;
  preload: () => Promise<PageModule<React.ComponentType<unknown>>>;
  lang: string;
}

// #region RemarkSplitMdxOptions
/**
 * Filter rule format: [specifiers, source]
 * - specifiers: Array of component/function names to match
 * - source: Import source to match
 *
 * Example: [['Table', 'Button'], '@lynx']
 * Matches: import { Table, Button } from '@lynx'
 */
type FilterRule = [string[], string];

interface RemarkSplitMdxOptions {
  /**
   * Include rules for filtering imports and JSX elements
   * Format: [[specifiers, source], ...]
   *
   * @example
   * includes: [
   *   [['Table', 'Button'], '@lynx'],
   *   [['Card'], 'antd']
   * ]
   */
  includes?: FilterRule[];

  /**
   * Exclude rules for filtering imports and JSX elements
   * Takes precedence over includes
   * Format: [[specifiers, source], ...]
   *
   * @example
   * excludes: [
   *   [['LegacyTable'], '@lynx']
   * ]
   */
  excludes?: FilterRule[];
}
// #endregion

export interface RouteMeta {
  routePath: string;
  absolutePath: string;
  relativePath: string;
  pageName: string;
  lang: string;
  version: string;
}

export interface ReplaceRule {
  search: string | RegExp;
  replace: string;
}

export interface Header {
  id: string;
  text: string;
  depth: number;
  charIndex: number;
}

// The general i18n config, which is not related to the theme.
export interface Locale {
  lang: string;
  label: string;
  title?: string;
  description?: string;
}

export interface UserConfig {
  /**
   * The root directory of the site.
   * @default 'docs'
   */
  root?: string;
  /**
   * Path to the logo file in nav bar.
   */
  logo?: string | { dark: string; light: string };
  /**
   * The text of the logo in nav bar.
   * @default ''
   */
  logoText?: string;
  /**
   * Base path of the site.
   * @default '/'
   */
  base?: string;
  /**
   * Path to html icon file.
   */
  icon?: string | URL;
  /**
   * Default language of the site.
   * @default 'en'
   */
  lang?: string;
  /**
   * Title of the site.
   * @default 'Rspress'
   */
  title?: string;
  /**
   * Description of the site.
   * @default ''
   */
  description?: string;
  /**
   * Head tags.
   */
  head?: (
    | string
    | [string, Record<string, string>]
    | ((
        route: RouteMeta,
      ) => string | [string, Record<string, string>] | undefined)
  )[];
  /**
   * I18n config of the site.
   */
  locales?: Locale[];
  /**
   * The i18n text data source path. Default is `i18n.json` in cwd.
   * @default '<cwd>/i18n.json'
   */
  i18nSourcePath?: string;
  /**
   * The i18n text data.
   */
  i18nSource?:
    | (I18nText & Record<string, Record<string, string>>)
    | ((
        value: Record<string, Record<string, string>>,
      ) =>
        | Record<string, Record<string, string>>
        | Promise<Record<string, Record<string, string>>>);
  /**
   * Theme config.
   */
  themeConfig?: DefaultThemeConfig;
  /**
   * Rsbuild Configuration
   */
  builderConfig?: RsbuildConfig;
  /**
   * The custom config of vite-plugin-route
   */
  route?: RouteOptions;
  /**
   * The custom config of markdown compile
   */
  markdown?: MarkdownOptions;
  /**
   * Doc plugins
   */
  plugins?: RspressPlugin[];
  /**
   * Replace rule, will replace the content of the page.
   */
  replaceRules?: ReplaceRule[];
  /**
   * Output directory
   */
  outDir?: string;
  /**
   * User side custom theme directory
   */
  themeDir?: string;
  /**
   * Global components
   */
  globalUIComponents?: (string | [string, object])[];
  /**
   * Global styles, is a Absolute path
   */
  globalStyles?: string;
  /**
   * Search options
   */
  search?: SearchOptions;
  /**
   * Whether to enable ssg
   * @default true
   */
  ssg?:
    | boolean
    | {
        /**
         * After enabled, you can use worker to accelerate the SSG process and reduce memory usage. It is suitable for large document sites and is based on [tinypool](https://github.com/tinylibs/tinypool).
         * @default false
         */
        experimentalWorker?: boolean;
        /**
         * After enabled, some pages will not be rendered by SSG, and they will directly use html under CSR. This is suitable for SSG errors in large document sites bypassing a small number of pages. It is not recommended to enable this option actively.
         * @default []
         */
        experimentalExcludeRoutePaths?: (string | RegExp)[];
      };

  /**
   * Whether to enable llms and ssg-md
   * @default false
   * @experimental
   */
  llms?:
    | boolean
    | {
        /**
         * @experimental
         */
        remarkSplitMdxOptions?: RemarkSplitMdxOptions;
      };
  /**
   * Whether to enable medium-zoom
   * @default true
   */
  mediumZoom?:
    | boolean
    | {
        selector?: string;
        options?: ZoomOptions;
      };
  /**
   * Multi version config
   */
  multiVersion?: {
    /**
     * The default version
     */
    default?: string;
    /**
     * The version list, such as ['v1', 'v2']
     */
    versions: string[];
  };
  /**
   * Language parity checking config
   */
  languageParity?: {
    /**
     * Whether to enable language parity checking
     */
    enabled?: boolean;
    /**
     * Directories to include in the parity check
     */
    include?: string[];
    /**
     * Directories to exclude from the parity check
     */
    exclude?: string[];
  };
}

type RemoveUnderscoreProps<T> = {
  [K in keyof T as K extends `_${string}` ? never : K]: T[K];
};

export type BaseRuntimePageInfo = Omit<
  RemoveUnderscoreProps<PageIndexInfo>,
  'id' | 'content' | 'domain'
>;

export interface PageData {
  pages: BaseRuntimePageInfo[];
}

export interface PageDataLegacy {
  siteData: SiteData & { pages: BaseRuntimePageInfo[] };
  page: BaseRuntimePageInfo & {
    headingTitle?: string;
    pagePath: string;
    lastUpdatedTime?: string;
    description?: string;
    pageType: PageType;
    [key: string]: unknown;
  };
}

export interface SiteData {
  base: string;
  lang: string;
  route: RouteOptions;
  locales: { lang: string; label: string }[];
  title: string;
  description: string;
  icon: string;
  themeConfig: NormalizedDefaultThemeConfig;
  logo: string | { dark: string; light: string };
  logoText: string;
  search: SearchOptions;
  markdown: {
    showLineNumbers: boolean;
    defaultWrapCode: boolean;
    shiki: Partial<RehypeShikiOptions>;
  };
  multiVersion: {
    default: string;
    versions: string[];
  };
}

/**
 * @description search-index.json file
 * "_foo" is the private field that won't be written to search-index.json file
 * and should not be used in the runtime (usePageData).
 */
export interface PageIndexInfo {
  // can be used as id
  routePath: string;

  title: string;
  toc: Header[];
  content: string;
  _flattenContent?: string;
  /* html content is too large to be written to index file */
  _html: string;
  frontmatter: FrontMatterMeta;
  lang: string;
  version: string;
  _filepath: string;
  _relativePath: string;
}

export type RemotePageInfo = PageIndexInfo & {
  _matchesPosition: {
    content: {
      start: number;
      length: number;
    }[];
  };
};

export interface Hero {
  badge?: string;
  name?: string;
  text?: string;
  tagline?: string;
  image?: {
    src?: string | { dark: string; light: string };
    alt?: string;
    /**
     * `srcset` and `sizes` are attributes of `<img>` tag. Please refer to https://mdn.io/srcset for the usage.
     * When the value is an array, rspress will join array members with commas.
     **/
    sizes?: string | string[];
    srcset?: string | string[];
  };
  actions?: {
    text: string;
    link: string;
    theme: 'brand' | 'alt';
  }[];
}

export interface Feature {
  icon: string;
  title: string;
  details: string;
  span?: number;
  link?: string;
}

export interface PageModule<T extends React.ComponentType<unknown>> {
  default: T;
  frontmatter?: FrontMatterMeta;
  content?: string;
  [key: string]: unknown;
}

export type PageType = 'home' | 'doc' | 'doc-wide' | 'custom' | '404' | 'blank';

export interface FrontMatterMeta {
  title?: string;
  description?: string;
  overview?: boolean;
  pageType?: PageType;
  features?: Feature[];
  hero?: Hero;

  // ui
  navbar?: boolean;
  sidebar?: boolean;
  outline?: boolean;
  footer?: boolean;

  lineNumbers?: boolean;
  overviewHeaders?: number[];
  titleSuffix?: string;
  head?: [string, Record<string, string>][];
  context?: string;
  [key: string]: unknown;
}

export interface RouteOptions {
  /**
   * The extension name of the filepath that will be converted to a route
   * @default ['js','jsx','ts','tsx','md','mdx']
   */
  extensions?: string[];
  /**
   * Include extra files from being converted to routes
   * @default []
   */
  include?: string[];
  /**
   * Exclude files from being converted to routes
   * @default []
   */
  exclude?: string[];
  /**
   * Exclude convention files from being converted to routes
   * @default ['**\/_[^_]*']
   */
  excludeConvention?: string[];
  /**
   * use links without .html files
   * @default false
   */
  cleanUrls?: boolean;
}

export interface SearchHooks {
  /**
   * The search hook function path. The corresponding file should export a function named `onSearch`.
   */
  searchHooks?: string;
}

export type LocalSearchOptions = SearchHooks & {
  mode?: 'local';
  /**
   * Whether to generate separate search index for each version
   */
  versioned?: boolean;
  /**
   * If enabled, the search index will include code block content, which allows users to search code blocks.
   * @default true
   */
  codeBlocks?: boolean;
};

export type SearchOptions = LocalSearchOptions | false;

export type RemarkLinkOptions = {
  /**
   * Whether to enable check dead links
   * @default true
   */
  checkDeadLinks?:
    | boolean
    | { excludes: string[] | ((url: string) => boolean) };
  /**
   * [](/v3/zh/guide) [](/zh/guide) [](/guide) will be regarded as the same [](/v3/zh/guide) according to the directory.
   * @default true
   */
  autoPrefix?: boolean;
};

export interface MarkdownOptions {
  remarkPlugins?: PluggableList;
  rehypePlugins?: PluggableList;
  link?: RemarkLinkOptions;
  showLineNumbers?: boolean;
  /**
   * Whether to wrap code by default
   * @default false
   */
  defaultWrapCode?: boolean;
  /**
   * Register global components in mdx files
   */
  globalComponents?: string[];
  /**
   * @type import('@shikijs/rehype').RehypeShikiOptions
   */
  shiki?: Partial<RehypeShikiOptions>;

  /**
   * Speed up build time by caching mdx parsing result in `rspress build`
   * @default true
   */
  crossCompilerCache?: boolean;
}

export type Config =
  | UserConfig
  | Promise<UserConfig>
  | ((
      ...args: Parameters<typeof loadConfig>
    ) => UserConfig | Promise<UserConfig>);
