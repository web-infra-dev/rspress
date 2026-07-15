import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginWebMcp } from '@rspress/plugin-webmcp';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  title: 'WebMCP fixture',
  lang: 'en',
  locales: [
    { lang: 'en', label: 'English' },
    { lang: 'zh', label: '简体中文' },
  ],
  multiVersion: {
    default: 'v1',
    versions: ['v1', 'v2'],
  },
  search: {},
  themeConfig: {
    nav: [{ text: 'Guide', link: '/guide' }],
    sidebar: {
      '/': [
        { text: 'Home', link: '/' },
        { text: 'Guide', link: '/guide' },
      ],
    },
  },
  globalUIComponents: [path.join(import.meta.dirname, 'src/CounterTools.tsx')],
  builderConfig: {
    source: {
      preEntry: path.join(import.meta.dirname, 'src/polyfill.ts'),
    },
  },
  plugins: [pluginWebMcp()],
});
