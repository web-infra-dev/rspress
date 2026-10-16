import type { UserConfig } from '@rspress/shared';
import { normalizeHref } from '@rspress/shared';
import { describe, expect, it } from '@rstest/core';
import { PluginDriver } from './PluginDriver';
import { createSiteData } from './runtimeModule/siteData/createSiteData';

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
