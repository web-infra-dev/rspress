import { CliPlugin, ModuleTools } from '@modern-js/module-tools';
import { UserConfig } from '@rspress/core';
import { PluginOptions as PluginOptions$1 } from '@rspress/plugin-api-docgen';
import { Options } from '@rspress/plugin-preview';

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
type PluginOptions = PluginOptions$1 & Omit<Options, 'previewMode'> & ExtraOptions;

declare const modulePluginDoc: (pluginOptions?: PluginOptions) => CliPlugin<ModuleTools>;

export { type PluginOptions, modulePluginDoc as default, modulePluginDoc };
