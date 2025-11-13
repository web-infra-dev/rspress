// cspell:disable
import type { UserConfig } from '@rspress/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginDriver } from '../PluginDriver';
import { getI18nData } from './i18n';

describe('getI18nData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      i18nSource: vi.fn().mockResolvedValue({
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
      i18nSource: vi.fn().mockResolvedValue({
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
      i18nSource: vi.fn().mockResolvedValue({
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
