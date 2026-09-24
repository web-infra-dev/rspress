import { logger, type RspressPlugin, type SitemapOptions } from '@rspress/core';

/** @deprecated Sitemap generation is built into Rspress. Use `sitemap` in the Rspress config instead. */
export type PluginSitemapOptions = SitemapOptions;

/** @deprecated Sitemap generation is built into Rspress. Use `sitemap` in the Rspress config instead. */
export function pluginSitemap(
  options: PluginSitemapOptions = {},
): RspressPlugin {
  return {
    name: '@rspress/plugin-sitemap',
    config(config) {
      logger.warn(
        '@rspress/plugin-sitemap is a legacy plugin. Sitemap generation is built into Rspress. Use the `sitemap` config instead.',
      );
      if (config.sitemap !== false) {
        const sitemap =
          typeof config.sitemap === 'object' ? config.sitemap : {};
        config.sitemap = {
          ...options,
          ...sitemap,
          customMaps: { ...options.customMaps, ...sitemap.customMaps },
        };
      }
      return config;
    },
  };
}
