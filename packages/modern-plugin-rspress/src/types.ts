import type { UserConfig } from '@rspress/core';
import type { PluginOptions as DocGenOptions } from '@rspress/plugin-api-docgen';
import type { Options as PreviewOptions } from '@rspress/plugin-preview';

/**
 * @deprecated
 */
type DeprecatedMode = 'mobile' | 'web';

/**
 * @deprecated
 */
type ModuleDocgenLanguage = 'zh' | 'en';

type ExtraOptions = {
  /**
   * Target language
   * @deprecated Please use https://rspress.dev/guide/default-theme/i18n.html
   */
  languages?: Array<ModuleDocgenLanguage>;
  /**
   * set it true to use module default sidebar, or customize the sidebar with false value
   * @deprecated Please see https://rspress.dev/guide/basic/auto-nav-sidebar.html
   */
  useModuleSidebar?: boolean;
  /**
   * Doc framework config
   */
  doc?: UserConfig;
  /**
   * previewMode
   * @default 'internal'
   */
  previewMode?: DeprecatedMode | 'internal' | 'iframe';
};

export type PluginOptions = DocGenOptions &
  Omit<PreviewOptions, 'previewMode'> &
  ExtraOptions;
