import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  title: 'WebMCP docs',
  description: 'Documentation tools',
  base: '/docs/',
  llms: true,
  webMcp: { exposedTo: ['https://agent.example'] },
  route: { cleanUrls: true, localeRedirect: 'never' },
  lang: 'en',
  locales: [
    { lang: 'en', label: 'English' },
    { lang: 'zh', label: '中文' },
  ],
  multiVersion: { default: 'v1', versions: ['v1', 'v2'] },
});
