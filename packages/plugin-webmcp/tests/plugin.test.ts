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
    tools: {
      siteInfo: boolean;
      listPages: boolean;
      getPage: boolean;
      currentPage: boolean;
      search: boolean;
      navigate: boolean;
    };
  };
}

describe('pluginWebMcp', () => {
  test('normalizes built-in tools', () => {
    expect(normalizePluginWebMcpOptions()).toEqual({
      tools: {
        siteInfo: true,
        listPages: true,
        getPage: true,
        currentPage: true,
        search: true,
        navigate: true,
      },
    });
    expect(
      normalizePluginWebMcpOptions({
        tools: { currentPage: false, navigate: false },
      }),
    ).toEqual({
      tools: {
        siteInfo: true,
        listPages: true,
        getPage: true,
        currentPage: false,
        search: true,
        navigate: false,
      },
    });
  });

  test('automatically enables SSG-MD', async () => {
    const plugin = pluginWebMcp();
    const config = await plugin.config?.({}, configUtils, true);
    expect(config?.llms).toBe(true);
    expect(plugin.globalUIComponents).toHaveLength(1);
    expect(getRuntimeOptions(plugin).tools.currentPage).toBe(true);
  });

  test('does not enable SSG-MD during development', async () => {
    const plugin = pluginWebMcp();
    const runtimeOptions = getRuntimeOptions(plugin);
    const config = await plugin.config?.({}, configUtils, false);

    expect(config?.llms).toBeUndefined();
    expect(runtimeOptions.tools.currentPage).toBe(true);
  });

  test('keeps requested tools unchanged across the build lifecycle', async () => {
    const plugin = pluginWebMcp({
      tools: { currentPage: true, search: false, navigate: false },
    });
    const runtimeOptions = getRuntimeOptions(plugin);

    await plugin.config?.({}, configUtils, true);
    await plugin.beforeBuild?.({ llms: true, search: false }, true);

    expect(runtimeOptions.tools).toEqual({
      siteInfo: true,
      listPages: true,
      getPage: true,
      currentPage: true,
      search: false,
      navigate: false,
    });
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
      'Enabled Markdown page tools require SSG-MD',
    );
  });

  test('requires SSG-MD when only get-page is enabled', () => {
    const plugin = pluginWebMcp({ tools: { currentPage: false } });
    expect(() => plugin.config?.({ llms: false }, configUtils, true)).toThrow(
      'Enabled Markdown page tools require SSG-MD',
    );
  });

  test('allows llms false when both Markdown tools are disabled', async () => {
    const plugin = pluginWebMcp({
      tools: { currentPage: false, getPage: false },
    });
    const config = { llms: false };
    expect(await plugin.config?.(config, configUtils, true)).toBe(config);
    expect(plugin.beforeBuild?.(config, true)).toBeUndefined();
  });

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
      'Enabled Markdown page tools require SSG-MD',
    );
    await expect(runPlugins([disableLlms, webMcp])).rejects.toThrow(
      'Enabled Markdown page tools require SSG-MD',
    );
  });
});
