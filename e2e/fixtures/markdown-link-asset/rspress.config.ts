import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  base: '/base/',
  root: path.join(__dirname, 'doc'),
  lang: 'en',
  route: {
    cleanUrls: false,
  },
  themeConfig: {
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
  markdown: {
    link: {
      checkDeadLinks: {
        excludes: ['/hello.html', '/test.md', '/arrow-down.svg', '/plain.txt'],
      },
    },
  },
});
