import type { UserConfig } from '@rspress/core';
import type { PluginOptions as DocGenOptions } from '@rspress/plugin-api-docgen';

export type APIParseTools = 'ts-document' | 'react-docgen-typescript';

export type ModuleDocgenLanguage = 'zh' | 'en';

export type PluginOptions = Pick<
  Options,
  | 'entries'
  | 'languages'
  | 'doc'
  | 'previewMode'
  | 'apiParseTool'
  | 'parseToolOptions'
  | 'iframePosition'
  | 'useModuleSidebar'
  | 'defaultRenderMode'
>;

export type Options = {
  /**
   * Target language
   * @deprecated Please use https://rspress.dev/guide/default-theme/i18n.html
   */
  languages?: Array<ModuleDocgenLanguage>;
  /**
   * Doc framework config
   * @zh 文档框架配置
   */
  doc?: UserConfig;
  /**
   * isProduction
   * @zh 是否是生产环境
   * @default process.env.NODE_ENV === 'production'
   */
  isProduction?: boolean;
  /**
   * previewMode
   * @zh 预览方式
   * @default 'web'
   */
  previewMode?: 'mobile' | 'web';
  /**
   * set it true to use module default sidebar, or customize the sidebar with false value
   * @deprecated Please see https://rspress.dev/guide/basic/auto-nav-sidebar.html
   */
  useModuleSidebar?: boolean;
  /**
   * iframePosition
   */
  iframePosition?: 'fixed' | 'follow';
  /**
   * determine how to handle a internal code block without meta
   * @default 'preview'
   */
  defaultRenderMode?: 'pure' | 'preview';
} & DocGenOptions;
