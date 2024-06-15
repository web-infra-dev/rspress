import { defineConfig } from 'rspress/config';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';

export default defineConfig({
  root: 'docs',
  title: 'Rspress',
  description: 'Rspack based static site generator',
  lang: 'en',
  logo: {
    light:
      'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-0904.png',
    dark: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/rjhwzy/ljhwZthlaukjlkulzlp/rspress/rspress-navbar-logo-dark-0904.png',
  },
  icon: 'https://lf3-static.bytednsdoc.com/obj/eden-cn/uhbfnupenuhf/rspress/rspress-logo.png',
  markdown: {
    checkDeadLinks: true,
  },
  plugins: [pluginFontOpenSans()],
  builderConfig: {
    plugins: [
      pluginGoogleAnalytics({ id: 'G-66B2Z6KG0J' }),
      pluginOpenGraph({
        title: 'Rspress',
        type: 'website',
        url: 'https://rspress.dev/',
        image: 'https://rspress.dev/og-image.png',
        description: 'Rspack based static site generator',
        twitter: {
          site: '@rspack_dev',
          card: 'summary_large_image',
        },
      }),
    ],
  },
  route: {
    cleanUrls: true,
    exclude: ['**/fragments/**'],
  },
  themeConfig: {
    enableContentAnimation: true,
    footer: {
      message: '© 2024 Bytedance Inc. All Rights Reserved.',
    },
    hideNavbar: 'auto',
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
      {
        icon: 'discord',
        mode: 'link',
        content: 'https://discord.gg/mkVw5zPAtf',
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
        searchPlaceholderText: '搜索',
        searchNoResultsText: '未搜索到相关结果',
        searchSuggestedQueryText: '可更换不同的关键字后重试',
      },
      {
        lang: 'en',
        label: 'English',
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rspress/tree/main/packages/document/docs',
          text: '📝 Edit this page on GitHub',
        },
        searchPlaceholderText: 'Search',
      },
    ],
  },
});
