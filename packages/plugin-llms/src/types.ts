import type {
  Nav,
  PageIndexInfo,
  RouteMeta,
  RouteService,
  Sidebar,
} from '@rspress/core';

export interface LlmsTxt {
  /**
   * @default "llms.txt"
   */
  name: string;
  onTitleGenerate?: (context: {
    title: string | undefined;
    description: string | undefined;
  }) => string;
  onLineGenerate?: (page: PageIndexInfo) => string;
  onAfterLlmsTxtGenerate?: (llmsTxtContent: string) => string;
}

export interface MdFiles {
  /**
   * @default true
   */
  mdxToMd: boolean;
}

export interface LlmsFullTxt {
  /**
   * @default "llms-full.txt"
   */
  name: string;
}

export interface Options {
  /**
   * Whether to generate llms.txt.
   */
  llmsTxt?: false | LlmsTxt;
  /**
   * Whether to generate llms.txt related md files for each route.
   */
  mdFiles?: false | MdFiles;
  /**
   * Whether to generate llms-full.txt.
   */
  llmsFullTxt?: false | LlmsFullTxt;
  /**
   * Whether to include some routes from llms.txt.
   * @param context
   * @default (context) => context.page.lang === config.lang
   */
  include?: (context: { page: PageIndexInfo }) => boolean;
  /**
   * Whether to exclude some routes from llms.txt.
   * exclude will trigger after include
   * @default undefined
   */
  exclude?: (context: { page: PageIndexInfo }) => boolean;
}

export type RspressPluginLlmsOptions = Options | Options[];

export interface rsbuildPluginLlmsOptions {
  disableSSGRef: { current: boolean };
  titleRef: { current: string | undefined };
  descriptionRef: { current: string | undefined };
  langRef: { current: string | undefined };
  baseRef: { current: string };
  pageDataList: PageIndexInfo[];
  routeServiceRef: { current: RouteService | undefined };
  routes: RouteMeta[];
  sidebar: Sidebar;
  nav: {
    nav: Nav;
    lang: string;
  }[];
  rspressPluginOptions: Options;
  index?: number;
}
