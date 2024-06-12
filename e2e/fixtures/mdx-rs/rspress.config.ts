import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  lang: 'zh',
  markdown: {
    mdxRs: true,
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
              text: 'Guide',
              items: [
                {
                  text: 'Quick Start',
                  link: '/en/guide/quick-start',
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
