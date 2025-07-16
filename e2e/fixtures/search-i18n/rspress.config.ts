import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
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
    ],
  },
});
