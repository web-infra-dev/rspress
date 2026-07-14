import type { RspressPlugin, UserConfig } from '@rspress/core';
import { describe, expect, test } from '@rstest/core';
import { pluginWebMcp } from '../src';
import { normalizePluginWebMcpOptions } from '../src/options';

const configUtils = { addPlugin() {}, removePlugin() {} };

async function runPlugins(plugins: RspressPlugin[], config: UserConfig = {}) {
  let resolvedConfig = config;
  for (const plugin of plugins) {
    resolvedConfig =
      (await plugin.config?.(resolvedConfig, configUtils, true)) ??
      resolvedConfig;
  }
  for (const plugin of plugins) {
    await plugin.beforeBuild?.(resolvedConfig, true);
  }
  return resolvedConfig;
}

function getRuntimeOptions(plugin: RspressPlugin) {
  const component = plugin.globalUIComponents?.[0];
  if (!Array.isArray(component)) {
    throw new TypeError('Expected a global component with runtime options');
  }
  return component[1] as {
    currentPageEnabled: boolean;
    searchEnabled: boolean;
  };
}

describe('pluginWebMcp', () => {
  test('normalizes built-in tools', () => {
    expect(normalizePluginWebMcpOptions()).toEqual({
      tools: { currentPage: true, search: true, navigate: true },
    });
    expect(
      normalizePluginWebMcpOptions({
        tools: { currentPage: false, navigate: false },
      }),
    ).toEqual({
      tools: { currentPage: false, search: true, navigate: false },
    });
  });

  test('automatically enables SSG-MD', async () => {
    const plugin = pluginWebMcp();
    const config = await plugin.config?.({}, configUtils, true);
    expect(config?.llms).toBe(true);
    expect(plugin.globalUIComponents).toHaveLength(1);
    expect(getRuntimeOptions(plugin).currentPageEnabled).toBe(true);
  });

  test('does not enable SSG-MD when the current-page tool is unavailable', async () => {
    const plugin = pluginWebMcp();
    const config = await plugin.config?.({}, configUtils, false);
    expect(config?.llms).toBeUndefined();
    expect(getRuntimeOptions(plugin).currentPageEnabled).toBe(false);
  });

  test('exposes the current-page tool only for production output', async () => {
    const plugin = pluginWebMcp();
    await plugin.config?.({}, configUtils, true);
    await plugin.beforeBuild?.({ llms: true }, true);
    expect(getRuntimeOptions(plugin).currentPageEnabled).toBe(true);
  });

  test.each([true, { remarkSplitMdxOptions: {} }])(
    'preserves an existing llms configuration',
    async llms => {
      const plugin = pluginWebMcp();
      const config = { llms };
      expect(await plugin.config?.(config, configUtils, false)).toBe(config);
      expect(config.llms).toBe(llms);
    },
  );

  test('fails clearly when SSG-MD is explicitly disabled', () => {
    const plugin = pluginWebMcp();
    expect(() => plugin.config?.({ llms: false }, configUtils, true)).toThrow(
      'rspress_get_current_page tool requires SSG-MD',
    );
  });

  test('allows llms false when the current-page tool is disabled', async () => {
    const plugin = pluginWebMcp({ tools: { currentPage: false } });
    const config = { llms: false };
    expect(await plugin.config?.(config, configUtils, false)).toBe(config);
  });

  test.each(['before', 'after'] as const)(
    'omits local search when a plugin disables it %s WebMCP',
    async order => {
      const webMcp = pluginWebMcp();
      const disableSearch: RspressPlugin = {
        name: 'disable-search',
        config(config) {
          config.search = false;
          return config;
        },
      };
      const plugins =
        order === 'before' ? [disableSearch, webMcp] : [webMcp, disableSearch];

      await runPlugins(plugins);

      expect(getRuntimeOptions(webMcp).searchEnabled).toBe(false);
    },
  );

  test('validates llms after every plugin config hook', async () => {
    const webMcp = pluginWebMcp();
    const disableLlms: RspressPlugin = {
      name: 'disable-llms',
      config(config) {
        config.llms = false;
        return config;
      },
    };

    await expect(runPlugins([webMcp, disableLlms])).rejects.toThrow(
      'rspress_get_current_page tool requires SSG-MD',
    );
    await expect(runPlugins([disableLlms, webMcp])).rejects.toThrow(
      'rspress_get_current_page tool requires SSG-MD',
    );
  });
});
