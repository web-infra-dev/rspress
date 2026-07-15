import { join } from 'node:path';
import type { RspressPlugin, UserConfig } from '@rspress/core';
import {
  normalizePluginWebMcpOptions,
  type PluginWebMcpOptions,
} from './options';

export type { PluginWebMcpOptions, PluginWebMcpToolsOptions } from './options';

export function pluginWebMcp(options?: PluginWebMcpOptions): RspressPlugin {
  const runtimeOptions = normalizePluginWebMcpOptions(options);

  const requireSsgMd = (config: UserConfig, isProd: boolean) => {
    if (!runtimeOptions.tools.currentPage || !isProd) {
      return false;
    }
    if (config.llms === false) {
      throw new Error(
        '[@rspress/plugin-webmcp] The rspress_get_current_page tool requires SSG-MD. Remove `llms: false`, enable `llms`, or disable the current-page WebMCP tool.',
      );
    }
    return true;
  };

  return {
    name: '@rspress/plugin-webmcp',
    config(config, _configUtils, isProd) {
      if (requireSsgMd(config, isProd)) {
        config.llms ??= true;
      }
      return config;
    },
    beforeBuild(config, isProd) {
      requireSsgMd(config, isProd);
    },
    globalUIComponents: [
      [join(__dirname, 'runtime/WebMcpRuntime.js'), runtimeOptions],
    ],
  };
}
