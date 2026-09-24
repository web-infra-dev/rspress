import { logger, type UserConfig } from '@rspress/core';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { pluginSitemap, type PluginSitemapOptions } from './index';

afterEach(() => {
  rs.restoreAllMocks();
});

async function configure(config: UserConfig, options?: PluginSitemapOptions) {
  const warning = rs.spyOn(logger, 'warn').mockImplementation(() => {});
  const plugin = pluginSitemap(options);
  const result = await plugin.config!(
    config,
    { addPlugin: rs.fn(), removePlugin: rs.fn() },
    true,
  );
  return { plugin, result, warning };
}

describe('legacy sitemap plugin', () => {
  it('enables the built-in feature and warns that it is legacy', async () => {
    const { plugin, result, warning } = await configure({});
    expect(result.sitemap).toEqual({ customMaps: {} });
    expect(warning).toHaveBeenCalledWith(
      expect.stringContaining('Sitemap generation is built into Rspress'),
    );
    expect(plugin.beforeBuild).toBeUndefined();
    expect(plugin.extendPageData).toBeUndefined();
    expect(plugin.afterBuild).toBeUndefined();
  });

  it('forwards existing plugin options', async () => {
    const options: PluginSitemapOptions = {
      siteUrl: 'https://example.com/docs/',
      defaultPriority: '0.7',
      defaultChangeFreq: 'daily',
      customMaps: { '/guide': { loc: 'https://example.com/custom' } },
    };
    const { result } = await configure({ sitemap: true }, options);
    expect(result.sitemap).toEqual(options);
  });

  it('preserves explicit core options and merges custom maps', async () => {
    const { result } = await configure(
      {
        sitemap: {
          siteUrl: 'https://core.example',
          customMaps: {
            '/': { loc: 'https://core.example/home' },
            '/core': { loc: 'https://core.example/core' },
          },
        },
      },
      {
        siteUrl: 'https://legacy.example',
        defaultPriority: '0.6',
        customMaps: {
          '/': { loc: 'https://legacy.example/home' },
          '/legacy': { loc: 'https://legacy.example/legacy' },
        },
      },
    );
    expect(result.sitemap).toEqual({
      siteUrl: 'https://core.example',
      defaultPriority: '0.6',
      customMaps: {
        '/': { loc: 'https://core.example/home' },
        '/core': { loc: 'https://core.example/core' },
        '/legacy': { loc: 'https://legacy.example/legacy' },
      },
    });
  });

  it('respects an explicitly disabled sitemap', async () => {
    const { result } = await configure({ sitemap: false });
    expect(result.sitemap).toBe(false);
  });
});
