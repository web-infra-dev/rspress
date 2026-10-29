// cspell:disable
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { RspressPlugin, UserConfig } from '@rspress/shared';
import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { PluginDriver } from '../../PluginDriver';
import { getI18nData } from './getI18nData';
import { DEFAULT_I18N_TEXT } from './DEFAULT_I18N_TEXT';

describe('getI18nData', () => {
  it('provides Tamil text for every built-in key and preserves interpolation', async () => {
    const result = await getI18nData({ lang: 'ta' });

    for (const [key, translations] of Object.entries(DEFAULT_I18N_TEXT)) {
      expect(Object.keys(result[key])).toEqual(['ta']);
      expect(result[key].ta).toBe(translations.ta);
      expect(result[key].ta).toMatch(/[\u0b80-\u0bff]/u);
      expect(translations.ta.match(/\{\{\w+\}\}/g) ?? []).toEqual(
        translations.en.match(/\{\{\w+\}\}/g) ?? [],
      );
    }
  });

  beforeEach(() => {
    rs.clearAllMocks();
  });

  afterEach(() => {
    rs.restoreAllMocks();
  });

  it('tracks a custom BOM-prefixed i18n file and refreshes it after invalidation', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'rspress-i18n-'));
    try {
      const i18nSourcePath = path.join(tempDir, 'custom-translations.json');
      await writeFile(
        i18nSourcePath,
        `\uFEFF${JSON.stringify({ pluginKey: { zh: 'JSON 文案' } })}`,
      );
      const config: UserConfig = {
        mediumZoom: false,
        locales: [
          { lang: 'en', label: 'English' },
          { lang: 'zh', label: '中文' },
        ],
        i18nSourcePath,
        i18nSource: { pluginKey: { en: 'Config Text' } },
        plugins: [
          {
            name: 'plugin-i18n',
            i18nSource(source) {
              return {
                ...source,
                pluginKey: { en: 'Plugin Text', zh: '插件文案' },
              };
            },
          },
        ],
      };
      const driver = await PluginDriver.create(config, false);
      await driver.modifyConfig();
      const context = { addDependency: rs.fn(), addMissingDependency: rs.fn() };

      const result = await driver.getI18nData(context);

      expect(context.addDependency).toHaveBeenCalledWith(i18nSourcePath);
      expect(context.addDependency).toHaveBeenCalledTimes(1);
      expect(context.addMissingDependency).not.toHaveBeenCalled();
      expect(result.pluginKey).toEqual({ en: 'Config Text', zh: 'JSON 文案' });
      expect(result.languagesText).toEqual({ en: 'Languages', zh: '语言' });

      await writeFile(
        i18nSourcePath,
        JSON.stringify({ pluginKey: { zh: '更新后的 JSON 文案' } }),
      );
      const nextContext = {
        addDependency: rs.fn(),
        addMissingDependency: rs.fn(),
      };
      expect(await driver.getI18nData(nextContext)).toBe(result);
      expect(nextContext.addDependency).toHaveBeenCalledWith(i18nSourcePath);

      driver.invalidateI18nData();
      expect((await driver.getI18nData()).pluginKey).toEqual({
        en: 'Config Text',
        zh: '更新后的 JSON 文案',
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('tracks a missing custom i18n file through config utils and reads it when created', async () => {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'rspress-i18n-'));
    try {
      const i18nSourcePath = path.join(tempDir, 'custom-translations.json');
      let readI18nData!: Parameters<
        NonNullable<RspressPlugin['config']>
      >[1]['getI18nData'];
      const driver = await PluginDriver.create(
        {
          mediumZoom: false,
          lang: 'zh',
          i18nSourcePath,
          plugins: [
            {
              name: 'plugin-i18n',
              config(config, utils) {
                readI18nData = utils.getI18nData;
                return config;
              },
              i18nSource(source) {
                return { ...source, pluginKey: { en: 'Plugin Text' } };
              },
            },
          ],
        },
        false,
      );
      await driver.modifyConfig();
      const context = { addDependency: rs.fn(), addMissingDependency: rs.fn() };

      expect((await readI18nData(context)).pluginKey).toEqual({
        zh: 'Plugin Text',
      });
      expect(context.addMissingDependency).toHaveBeenCalledWith(i18nSourcePath);
      expect(context.addMissingDependency).toHaveBeenCalledTimes(1);
      expect(context.addDependency).not.toHaveBeenCalled();

      await writeFile(
        i18nSourcePath,
        JSON.stringify({ pluginKey: { zh: '新建文件文案' } }),
      );
      rs.clearAllMocks();

      driver.invalidateI18nData();
      expect((await readI18nData(context)).pluginKey).toEqual({
        zh: '新建文件文案',
      });
      expect(context.addDependency).toHaveBeenCalledWith(i18nSourcePath);
      expect(context.addDependency).toHaveBeenCalledTimes(1);
      expect(context.addMissingDependency).not.toHaveBeenCalled();
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  it('no locales and no lang', async () => {
    const config: UserConfig = {};
    const result = await getI18nData(config);
    expect(result.languagesText).toEqual({
      en: 'Languages',
    });
    expect(result.themeText).toEqual({
      en: 'Theme',
    });
  });

  it('no locales', async () => {
    const config: UserConfig = {
      lang: 'zh',
    };
    const result = await getI18nData(config);
    expect(result.languagesText).toEqual({
      zh: '语言',
    });
    expect(result.themeText).toEqual({
      zh: '主题',
    });
  });

  it('should return default i18n text when no custom config', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
    };

    const result = await getI18nData(config);

    expect(result).toBeDefined();
    expect(result.languagesText).toEqual({
      zh: '语言',
      en: 'Languages',
    });
    expect(result.themeText).toEqual({
      zh: '主题',
      en: 'Theme',
    });
  });

  it('should merge i18n source from object config', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
      i18nSource: {
        customKey: {
          zh: '自定义文案',
          en: 'Custom Text',
        },
        editLinkText: {
          zh: '📝 在 Gitlab 上编辑此页',
          en: '📝 Edit this page on Gitlab',
        },
      },
    };

    const result = await getI18nData(config);

    expect(result.customKey).toEqual({
      zh: '自定义文案',
      en: 'Custom Text',
    });
    expect(result.editLinkText).toEqual({
      zh: '📝 在 Gitlab 上编辑此页',
      en: '📝 Edit this page on Gitlab',
    });
  });

  it('should support function type i18nSource', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
        { lang: 'en_US', label: 'English (US)' },
      ],
      i18nSource: source => {
        // Add en_US as fallback from en
        for (const key of Object.keys(source)) {
          source[key].en_US = source[key].en;
        }
        return source;
      },
    };

    const result = await getI18nData(config);

    expect(result.languagesText).toEqual({
      zh: '语言',
      en: 'Languages',
      en_US: 'Languages',
    });
  });

  it('should merge plugin i18n source', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
    };

    const mockPluginDriver = {
      i18nSource: rs.fn().mockResolvedValue({
        pluginKey: {
          zh: '插件文案',
          en: 'Plugin Text',
        },
        editLinkText: {
          zh: '📝 在 GitHub 上编辑此页',
          en: '📝 Edit this page on GitHub',
        },
      }),
    } as unknown as PluginDriver;

    const result = await getI18nData(config, mockPluginDriver);

    expect(result.pluginKey).toEqual({
      zh: '插件文案',
      en: 'Plugin Text',
    });
    expect(result.editLinkText).toEqual({
      zh: '📝 在 GitHub 上编辑此页',
      en: '📝 Edit this page on GitHub',
    });
    expect(mockPluginDriver.i18nSource).toHaveBeenCalled();
  });

  it('should override plugin i18n with config i18nSource', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
      i18nSource: {
        editLinkText: {
          zh: '📝 在 Gitlab 上编辑此页',
          en: '📝 Edit this page on Gitlab',
        },
      },
    };

    const mockPluginDriver = {
      i18nSource: rs.fn().mockResolvedValue({
        editLinkText: {
          zh: '📝 在 GitHub 上编辑此页',
          en: '📝 Edit this page on GitHub',
        },
      }),
    } as unknown as PluginDriver;

    const result = await getI18nData(config, mockPluginDriver);

    // config i18nSource should override plugin
    expect(result.editLinkText).toEqual({
      zh: '📝 在 Gitlab 上编辑此页',
      en: '📝 Edit this page on Gitlab',
    });
  });

  it('should fallback to en when language is missing', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
        { lang: 'fr', label: 'Français' },
      ],
    };

    const result = await getI18nData(config);

    // fr should fallback to en
    expect(result.languagesText).toEqual({
      zh: '语言',
      en: 'Languages',
      fr: 'Languages', // fallback to en
    });
  });

  it('should throw error when both lang and en are missing', async () => {
    const config: UserConfig = {
      locales: [{ lang: 'fr', label: 'Français' }],
      i18nSource: {
        customKey: {
          zh: '自定义文案',
        },
      },
    };

    await expect(getI18nData(config)).rejects.toThrow(
      'i18n text missing for customKey',
    );
  });

  it('should use themeConfig.locales when locales is not defined', async () => {
    const config: UserConfig = {
      themeConfig: {
        locales: [
          { lang: 'zh', label: '简体中文' },
          { lang: 'en', label: 'English' },
        ],
      },
    };

    const result = await getI18nData(config);

    expect(result.languagesText).toEqual({
      zh: '语言',
      en: 'Languages',
    });
  });

  it('should filter i18n text by configured languages', async () => {
    const config: UserConfig = {
      locales: [{ lang: 'zh', label: '简体中文' }],
      i18nSource: {
        customKey: {
          zh: '自定义文案',
          en: 'Custom Text',
          fr: 'Texte personnalisé',
        },
      },
    };

    const result = await getI18nData(config);

    // Only zh should be included
    expect(result.customKey).toEqual({
      zh: '自定义文案',
    });
    expect(result.customKey).not.toHaveProperty('en');
    expect(result.customKey).not.toHaveProperty('fr');
  });

  it('should support function type i18nSource with mutation', async () => {
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
      i18nSource: source => {
        // Add new key
        source.functionKey = {
          zh: '函数文案',
          en: 'Function Text',
        };
        return source;
      },
    };

    const result = await getI18nData(config);

    expect(result.functionKey).toEqual({
      zh: '函数文案',
      en: 'Function Text',
    });
  });

  it('should merge priority: default < plugin < i18n.json < config', async () => {
    // This test verifies the merge order
    // default < plugin < i18n.json (mocked via require) < config
    const config: UserConfig = {
      locales: [
        { lang: 'zh', label: '简体中文' },
        { lang: 'en', label: 'English' },
      ],
      i18nSource: {
        editLinkText: {
          zh: '📝 配置文件',
          en: '📝 Config File',
        },
      },
    };

    const mockPluginDriver = {
      i18nSource: rs.fn().mockResolvedValue({
        editLinkText: {
          zh: '📝 插件',
          en: '📝 Plugin',
        },
        pluginOnlyKey: {
          zh: '插件独有',
          en: 'Plugin Only',
        },
      }),
    } as unknown as PluginDriver;

    const result = await getI18nData(config, mockPluginDriver);

    // Config should win
    expect(result.editLinkText).toEqual({
      zh: '📝 配置文件',
      en: '📝 Config File',
    });

    // Plugin key should exist
    expect(result.pluginOnlyKey).toEqual({
      zh: '插件独有',
      en: 'Plugin Only',
    });
  });
});
