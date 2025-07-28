import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  lang: 'zh',
  base: '/base',
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    darkMode: false,
    localeRedirect: 'never',
    locales: [
      {
        lang: 'zh',
        title: '一个很棒的项目',
        description: '一个很棒的项目描述',
        // 语言切换按钮的文案
        // Language switch button text
        label: '简体中文',
      },
      {
        lang: 'en',
        title: 'A awesome project',
        description: 'A awesome project description',
        label: 'English',
      },
    ],
  },
});
