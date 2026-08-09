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
    if (
      (!runtimeOptions.tools.currentPage && !runtimeOptions.tools.getPage) ||
      !isProd
    ) {
      return false;
    }
    if (config.llms === false) {
      throw new Error(
        '[@rspress/plugin-webmcp] Enabled Markdown page tools require SSG-MD. Remove `llms: false`, enable `llms`, or disable both `currentPage` and `getPage`.',
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
