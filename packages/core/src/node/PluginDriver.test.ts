import type { RspressPlugin, UserConfig } from '@rspress/shared';
import { normalizeHref } from '@rspress/shared';
import { describe, expect, it, rs } from '@rstest/core';
import { PluginDriver } from './PluginDriver';
import { createSiteData } from './runtimeModule/siteData/createSiteData';

type ConfigUtils = Parameters<NonNullable<RspressPlugin['config']>>[1];
type I18nData = Awaited<ReturnType<ConfigUtils['getI18nData']>>;

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

  it('shares concurrent and sequential reads until the next compilation', async () => {
    let readI18nData!: ConfigUtils['getI18nData'];
    let text = 'Initial override';
    const userSource = rs.fn(async (source: I18nData) => ({
      ...source,
      pluginText: { ...source.pluginText, zh: text },
    }));
    const pluginSource = rs.fn((source: I18nData) => ({
      ...source,
      pluginText: { en: 'Plugin text' },
    }));
    const driver = await PluginDriver.create(
      {
        mediumZoom: false,
        lang: 'zh',
        i18nSource: userSource,
        plugins: [
          {
            name: 'capture-i18n-utils',
            config(config, utils) {
              readI18nData = utils.getI18nData;
              return config;
            },
            i18nSource: pluginSource,
          },
        ],
      },
      false,
    );

    const config = await driver.modifyConfig();
    const contexts = Array.from({ length: 2 }, () => ({
      addDependency: rs.fn(),
      addMissingDependency: rs.fn(),
    }));
    const [first, second] = await Promise.all([
      readI18nData(contexts[0]),
      driver.getI18nData(contexts[1]),
    ]);
    await createSiteData(config, driver);
    expect(first).toBe(second);
    expect((await readI18nData()).pluginText).toEqual({ zh: text });
    expect(pluginSource).toHaveBeenCalledTimes(1);
    expect(userSource).toHaveBeenCalledTimes(1);
    for (const context of contexts) {
      expect(context.addMissingDependency).toHaveBeenCalledWith(
        expect.stringMatching(/i18n\.json$/),
      );
      expect(context.addMissingDependency).toHaveBeenCalledTimes(1);
      expect(context.addDependency).not.toHaveBeenCalled();
    }

    text = 'Updated override';
    expect(await readI18nData()).toBe(first);
    expect(first.pluginText).toEqual({ zh: 'Initial override' });
    driver.invalidateI18nData();
    expect((await readI18nData()).pluginText).toEqual({ zh: text });
    expect(pluginSource).toHaveBeenCalledTimes(2);
    expect(userSource).toHaveBeenCalledTimes(2);
  });

  it('keeps different build drivers isolated', async () => {
    let text = 'First build';
    const source = rs.fn((data: I18nData) => ({
      ...data,
      buildText: { en: text },
    }));
    const config = { mediumZoom: false, i18nSource: source };
    const firstDriver = await PluginDriver.create({ ...config }, true);
    const secondDriver = await PluginDriver.create({ ...config }, true);
    await Promise.all([
      firstDriver.modifyConfig(),
      secondDriver.modifyConfig(),
    ]);

    const first = await firstDriver.getI18nData();
    text = 'Second build';
    const second = await secondDriver.getI18nData();

    expect(first.buildText.en).toBe('First build');
    expect(second.buildText.en).toBe('Second build');
    expect(await firstDriver.getI18nData()).toBe(first);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('shares a failed resolution and retries after invalidation', async () => {
    const error = new Error('Invalid i18n config');
    let fail = true;
    const source = rs.fn(async (data: I18nData) => {
      if (fail) {
        throw error;
      }
      return data;
    });
    const driver = await PluginDriver.create(
      { mediumZoom: false, i18nSource: source },
      false,
    );
    await driver.modifyConfig();
    const context = { addDependency: rs.fn(), addMissingDependency: rs.fn() };

    await expect(
      Promise.all([driver.getI18nData(context), driver.getI18nData()]),
    ).rejects.toBe(error);
    expect(context.addMissingDependency).toHaveBeenCalledTimes(1);
    await expect(driver.getI18nData()).rejects.toBe(error);
    expect(source).toHaveBeenCalledTimes(1);

    fail = false;
    driver.invalidateI18nData();
    expect((await driver.getI18nData()).languagesText.en).toBe('Languages');
    expect(source).toHaveBeenCalledTimes(2);
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
      const { siteData } = await createSiteData(config, driver);

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
    const { siteData } = await createSiteData(config, driver);

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
