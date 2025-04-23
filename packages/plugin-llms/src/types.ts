import type { RouteService } from '@rspress/core';
import type { Nav, PageIndexInfo, RouteMeta, Sidebar } from '@rspress/shared';

export interface LlmsTxt {
  onTitleGenerate?: (context: {
    title: string | undefined;
    description: string | undefined;
  }) => string;
  onLineGenerate?: (page: PageIndexInfo) => string;
  onAfterLlmsTxtGenerate?: (llmsTxtContent: string) => string;
}

export interface Options {
  /**
   * Whether to generate llms.txt.
   * @default true
   */
  llmsTxt?: boolean | LlmsTxt;
  /**
   * Whether to generate llms.txt related md files for each route.
   * @default true
   */
  mdFiles?: boolean;
  /**
   * Whether to generate llms.full.txt.
   * @default true
   */
  llmsFullTxt?: boolean;
  /**
   * Whether to exclude some routes from llms.txt.
   * @default undefined
   */
  exclude?: (context: { page: PageIndexInfo }) => boolean;
}

export interface rsbuildPluginLlmsOptions extends Options {
  docDirectoryRef: { current: string };
  titleRef: { current: string | undefined };
  descriptionRef: { current: string | undefined };
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
}
