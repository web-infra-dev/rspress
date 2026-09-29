import { defineConfig, type SitemapOptions } from '@rspress/core';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import config from './rspress.config';

export default defineConfig({
  ...config,
  ssg: false,
  outDir: 'legacy-build',
  sitemap: { defaultPriority: '0.7' },
  plugins: [
    pluginSitemap({
      ...(config.sitemap as SitemapOptions),
      defaultPriority: '0.2',
    }),
  ],
});
