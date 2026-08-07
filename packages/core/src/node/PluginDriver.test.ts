import type { RspressPlugin, UserConfig } from '@rspress/shared';
import { describe, expect, test } from '@rstest/core';
import { PluginDriver } from './PluginDriver';

async function observeLlmsConfig(config: UserConfig) {
  let observed: UserConfig['llms'];
  const plugin: RspressPlugin = {
    name: 'observe-llms-config',
    config(currentConfig) {
      observed = currentConfig.llms;
      return currentConfig;
    },
  };
  const driver = await PluginDriver.create(
    { mediumZoom: false, ...config, plugins: [plugin] },
    '',
    false,
  );
  const modifiedConfig = await driver.modifyConfig();
  return { observed, modifiedConfig };
}

describe('PluginDriver config normalization', () => {
  test('defaults llms after plugin config hooks', async () => {
    const { observed, modifiedConfig } = await observeLlmsConfig({});
    expect(observed).toBeUndefined();
    expect(modifiedConfig.llms).toBe(false);
  });

  test('preserves explicit llms false for plugin config hooks', async () => {
    const { observed, modifiedConfig } = await observeLlmsConfig({
      llms: false,
    });
    expect(observed).toBe(false);
    expect(modifiedConfig.llms).toBe(false);
  });
});
