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
  logo: {
    light:
      'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-0904.png',
    dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-dark-0904.png',
  },
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
    enableContentAnimation: true,
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
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rspress/tree/main/packages/document/docs',
          text: '📝 在 GitHub 上编辑此页',
        },
        prevPageText: '上一篇',
        nextPageText: '下一篇',
        outlineTitle: '目录',
      },
      {
        lang: 'en',
        label: 'English',
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rspress/tree/main/packages/document/docs',
          text: '📝 Edit this page on GitHub',
        },
      },
    ],
  },
});
