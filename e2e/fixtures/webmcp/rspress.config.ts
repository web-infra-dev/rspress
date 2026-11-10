import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  // Each scenario uses different virtual modules with the same source files.
  builderConfig: { performance: { buildCache: false } },
  title: 'WebMCP docs',
  description: 'Documentation tools',
  base: '/docs/',
  llms: true,
  themeConfig: { llmsUI: false },
  themeDir: path.join(import.meta.dirname, 'custom-theme'),
  search: {
    searchHooks: path.join(import.meta.dirname, 'custom-theme/searchHooks.ts'),
  },
  webMcp: { exposedTo: ['https://agent.example'] },
  route: { cleanUrls: true, localeRedirect: 'never' },
  lang: 'en',
  locales: [
    { lang: 'en', label: 'English' },
    { lang: 'zh', label: '中文' },
  ],
  multiVersion: { default: 'v1', versions: ['v1', 'v2'] },
});
