import type { RspressPlugin, UserConfig } from '@rspress/shared';
import { normalizeHref } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { PluginDriver } from './PluginDriver';
import { createSiteData } from './runtimeModule/siteData/createSiteData';

type ConfigUtils = Parameters<NonNullable<RspressPlugin['config']>>[1];

describe('config utils.getI18nData', () => {
  it('uses the final config and dynamically added plugins with normal merge and fallback rules', async () => {
    let readI18nData!: ConfigUtils['getI18nData'];
    let resolvedData: Awaited<ReturnType<ConfigUtils['getI18nData']>>;
    const driver = await PluginDriver.create(
      {
        mediumZoom: false,
        lang: 'en',
        plugins: [
          {
            name: 'capture-i18n-utils',
            config(config, utils) {
              readI18nData = utils.getI18nData;
              utils.addPlugin({
                name: 'dynamic-i18n',
                i18nSource(source) {
                  return {
                    ...source,
                    pluginText: {
                      en: 'Plugin text',
                      zh: '插件文案',
                      ru: 'Unused translation',
                    },
                    fallbackText: { en: 'Fallback text' },
                  };
                },
              });
              return config;
            },
            async beforeBuild() {
              resolvedData = await readI18nData();
            },
          },
          {
            name: 'replace-config',
            config(config) {
              return {
                ...config,
                locales: [
                  { lang: 'zh', label: '中文' },
                  { lang: 'en', label: 'English' },
                ],
                i18nSource: { pluginText: { zh: '用户文案' } },
              };
            },
          },
        ],
      },
      true,
    );

    await driver.modifyConfig();
    await driver.beforeBuild();

    expect(resolvedData!.pluginText).toEqual({
      zh: '用户文案',
      en: 'Plugin text',
    });
    expect(resolvedData!.fallbackText).toEqual({
      zh: 'Fallback text',
      en: 'Fallback text',
    });
    expect(resolvedData!.languagesText).toEqual({
      zh: '语言',
      en: 'Languages',
    });
  });

  it('applies async user overrides on each read', async () => {
    let readI18nData!: ConfigUtils['getI18nData'];
    let text = 'Initial override';
    const driver = await PluginDriver.create(
      {
        mediumZoom: false,
        lang: 'zh',
        i18nSource: async source => ({
          ...source,
          pluginText: { ...source.pluginText, zh: text },
        }),
        plugins: [
          {
            name: 'capture-i18n-utils',
            config(config, utils) {
              readI18nData = utils.getI18nData;
              return config;
            },
            i18nSource(source) {
              return { ...source, pluginText: { en: 'Plugin text' } };
            },
          },
        ],
      },
      false,
    );

    await driver.modifyConfig();

    expect((await readI18nData()).pluginText).toEqual({ zh: text });
    text = 'Updated override';
    expect((await readI18nData()).pluginText).toEqual({ zh: text });
  });
});

describe('route.cleanUrls defaults', () => {
  it.each([undefined, {}, { cleanUrls: undefined }, { cleanUrls: true }])(
    'generates clean links for route=%j',
    async route => {
      const driver = await PluginDriver.create(
        { mediumZoom: false, route },
        false,
      );
      const config = await driver.modifyConfig();
      const { siteData } = await createSiteData(config);

      expect(normalizeHref('/guide.html', siteData.route?.cleanUrls)).toBe(
        '/guide',
      );
      expect(
        normalizeHref('/folder/index.html', siteData.route?.cleanUrls),
      ).toBe('/folder/');
    },
  );

  it('preserves an explicit opt-out and other route options', async () => {
    const route: UserConfig['route'] = {
      cleanUrls: false,
      localeRedirect: 'never',
      exclude: ['private/**'],
    };
    const driver = await PluginDriver.create(
      { mediumZoom: false, route },
      false,
    );
    const config = await driver.modifyConfig();
    const { siteData } = await createSiteData(config);

    expect(config.route).toEqual(route);
    expect(normalizeHref('/guide', siteData.route?.cleanUrls)).toBe(
      '/guide.html',
    );
  });

  it('allows config hooks to override the default', async () => {
    const driver = await PluginDriver.create(
      {
        mediumZoom: false,
        plugins: [
          {
            name: 'disable-clean-urls',
            config(config) {
              expect(config.route?.cleanUrls).toBe(true);
              return {
                ...config,
                route: { ...config.route, cleanUrls: false },
              };
            },
          },
        ],
      },
      false,
    );

    expect((await driver.modifyConfig()).route?.cleanUrls).toBe(false);
  });
});
