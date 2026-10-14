import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { normalizeThemeConfig } from './normalizeThemeConfig';

describe('normalizeThemeConfig', () => {
  it('should normalize lastUpdated author callback for runtime site data', async () => {
    const author = ({ name }: { name: string }) => name;
    const config: UserConfig = {
      themeConfig: {
        lastUpdated: {
          author,
        },
      },
    };

    const themeConfig = await normalizeThemeConfig(config);

    expect(themeConfig.lastUpdated).toEqual({
      author: true,
    });
    expect(
      typeof (config.themeConfig?.lastUpdated as { author: unknown }).author,
    ).toBe('function');
  });

  it('adds the locale prefix only when the link does not start with the lang as a segment', async () => {
    // regression: with lang `en`, `/enterprise/features` matched
    // `startsWith('/en')` and was treated as already localized, so the
    // English sidebar pointed at the default-language page.
    const config: UserConfig = {
      lang: 'zh',
      locales: [
        { lang: 'zh', label: '中文' },
        { lang: 'en', label: 'English' },
      ],
      themeConfig: {
        sidebar: {
          '/guide': [{ text: 'Features', link: '/enterprise/features' }],
        },
      },
    };

    const themeConfig = await normalizeThemeConfig(config);

    const locales = themeConfig.locales as {
      lang: string;
      sidebar: Record<string, { link: string }[]>;
    }[];
    const zhLocale = locales.find(locale => locale.lang === 'zh');
    const enLocale = locales.find(locale => locale.lang === 'en');

    expect(zhLocale?.sidebar['/guide'][0].link).toBe(
      '/enterprise/features.html',
    );
    expect(enLocale?.sidebar['/guide'][0].link).toBe(
      '/en/enterprise/features.html',
    );
  });
});
