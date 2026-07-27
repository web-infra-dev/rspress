import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

const htmlImageIcon =
  '<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" width="48" height="32" />';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  lang: 'zh',
  base: '/base',
  route: {
    localeRedirect: 'never',
  },
  themeConfig: {
    darkMode: false,
    locales: [
      {
        lang: 'zh',
        title: '一个很棒的项目',
        description: '一个很棒的项目描述',
        sidebar: {
          '/guide/': [
            {
              text: '指南',
              items: [
                {
                  text: '快速上手',
                  link: '/guide/quick-start',
                },
                {
                  text: '安装',
                  link: '/guide/install',
                },
              ],
            },
          ],
        },
        // 语言切换按钮的文案
        // Language switch button text
        label: '简体中文',
      },
      {
        lang: 'en',
        title: 'A awesome project',
        description: 'A awesome project description',
        sidebar: {
          '/en/guide/': [
            {
              sectionHeaderText: 'Resources',
              icon: htmlImageIcon,
            },
            {
              text: 'Guide',
              icon: htmlImageIcon,
              items: [
                {
                  text: 'Quick Start',
                  link: '/en/guide/quick-start',
                  icon: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/></svg>',
                  tag: 'new',
                },
                {
                  text: 'Install',
                  link: '/en/guide/install',
                },
              ],
            },
          ],
        },
        label: 'English',
      },
    ],
  },
});
