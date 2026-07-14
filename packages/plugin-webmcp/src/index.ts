import path from 'node:path';
import type { RspressPlugin, UserConfig } from '@rspress/core';
import {
  normalizePluginWebMcpOptions,
  type PluginWebMcpOptions,
  type WebMcpRuntimeOptions,
} from './options';

export type { PluginWebMcpOptions, PluginWebMcpToolsOptions } from './options';

export function pluginWebMcp(options?: PluginWebMcpOptions): RspressPlugin {
  const normalizedOptions = normalizePluginWebMcpOptions(options);
  const runtimeOptions: WebMcpRuntimeOptions = {
    ...normalizedOptions,
    currentPageEnabled: normalizedOptions.tools.currentPage,
    searchEnabled: normalizedOptions.tools.search,
  };

  const syncRuntimeOptions = (config: UserConfig, isProd: boolean) => {
    const currentPageEnabled = normalizedOptions.tools.currentPage && isProd;
    runtimeOptions.currentPageEnabled = currentPageEnabled;
    runtimeOptions.searchEnabled =
      normalizedOptions.tools.search && config.search !== false;
    if (currentPageEnabled && config.llms === false) {
      throw new Error(
        '[@rspress/plugin-webmcp] The rspress_get_current_page tool requires SSG-MD. Remove `llms: false`, enable `llms`, or disable the current-page WebMCP tool.',
      );
    }
    return currentPageEnabled;
  };

  return {
    name: '@rspress/plugin-webmcp',
    config(config, _configUtils, isProd) {
      if (syncRuntimeOptions(config, isProd)) {
        config.llms ??= true;
      }
      return config;
    },
    beforeBuild(config, isProd) {
      syncRuntimeOptions(config, isProd);
    },
    globalUIComponents: [
      [path.join(__dirname, 'runtime/WebMcpRuntime.js'), runtimeOptions],
    ],
  };
}
