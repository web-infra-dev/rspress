import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  siteOrigin: 'https://example.com',
  base: '/docs/',
  sitemap: {
    defaultPriority: '0.7',
    defaultChangeFreq: 'weekly',
    customMaps: {
      '/': { loc: 'https://example.com/docs/', lastmod: '2026-01-01' },
    },
  },
});
