import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  lang: 'en',
  themeConfig: {
    locales: [
      {
        lang: 'zh',
        label: '简体中文',
      },
      {
        lang: 'en',
        label: 'English',
      },
      {
        lang: 'ja',
        label: '日本語',
      },
    ],
    localeRedirect: 'never',
  },
});
