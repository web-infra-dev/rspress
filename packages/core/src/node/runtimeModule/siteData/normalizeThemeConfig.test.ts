import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { UserConfig } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { PluginDriver } from '../../PluginDriver';
import { createSiteData } from './createSiteData';
import { normalizeThemeConfig } from './normalizeThemeConfig';

describe('normalizeThemeConfig', () => {
  it.each(['config', 'file'] as const)(
    'preserves plugin defaults when %s overrides only one language',
    async source => {
      const tempDir = await mkdtemp(path.join(tmpdir(), 'rspress-theme-i18n-'));
      try {
        const overrides = { pluginLabel: { zh: '自定义属性' } };
        const config: UserConfig = {
          mediumZoom: false,
          lang: 'en',
          locales: [
            { lang: 'en', label: 'English' },
            { lang: 'zh', label: '中文' },
          ],
          i18nSourcePath: path.join(tempDir, 'i18n.json'),
          themeConfig: {
            nav: [{ text: 'pluginLabel', link: '/guide' }],
            sidebar: { '/': [{ text: 'pluginLabel', link: '/guide' }] },
          },
          plugins: [
            {
              name: 'plugin-i18n',
              i18nSource(data) {
                return {
                  ...data,
                  pluginLabel: { en: 'Property', zh: '属性' },
                };
              },
            },
          ],
        };
        if (source === 'config') {
          config.i18nSource = overrides;
        } else {
          await writeFile(config.i18nSourcePath!, JSON.stringify(overrides));
        }
        const driver = await PluginDriver.create(config, false);
        const resolvedConfig = await driver.modifyConfig();
        const { siteData } = await createSiteData(resolvedConfig, driver);

        expect(siteData.themeConfig.locales).toMatchObject([
          {
            lang: 'en',
            nav: [{ text: 'Property' }],
            sidebar: { '/': [{ text: 'Property' }] },
          },
          {
            lang: 'zh',
            nav: [{ text: '自定义属性' }],
            sidebar: { '/': [{ text: '自定义属性' }] },
          },
        ]);
      } finally {
        await rm(tempDir, { recursive: true, force: true });
      }
    },
  );

  it('should normalize lastUpdated author callback for runtime site data', async () => {
    const author = ({ name }: { name: string }) => name;
    const config: UserConfig = {
      mediumZoom: false,
      themeConfig: {
        lastUpdated: {
          author,
        },
      },
    };

    const driver = await PluginDriver.create(config, false);
    const resolvedConfig = await driver.modifyConfig();
    const themeConfig = await normalizeThemeConfig(resolvedConfig, driver);

    expect(themeConfig.lastUpdated).toEqual({
      author: true,
    });
    expect(
      typeof (config.themeConfig?.lastUpdated as { author: unknown }).author,
    ).toBe('function');
  });
});
