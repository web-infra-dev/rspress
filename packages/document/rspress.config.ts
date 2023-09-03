import path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  markdown: {
    experimentalMdxRs: true,
    checkDeadLinks: true,
  },
  root: path.join(__dirname, 'docs'),
  title: 'Rspress',
  description: 'Rspack based static site generator',
  lang: 'en',
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/rspress/rspress-logo.png',
  builderConfig: {
    dev: {
      startUrl: false,
    },
  },
  route: {
    exclude: ['**/fragments/**'],
  },
  themeConfig: {
    footer: {
      message: '© 2023 Bytedance Inc. All Rights Reserved.',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
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
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/rspress/tree/main/packages/apps/website',
      text: 'Edit this page on GitHub',
    },
  },
});
