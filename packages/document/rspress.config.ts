import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginAlgolia } from '@rspress/plugin-algolia';
import { pluginShiki } from '@rspress/plugin-shiki';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';
import pluginSitemap from 'rspress-plugin-sitemap';
import { defineConfig } from 'rspress/config';

const siteUrl = 'https://rspress.dev';

export default defineConfig({
  root: 'docs',
  title: 'Rspress',
  description: 'Rspack based static site generator',
  lang: 'en',
  logo: 'https://assets.rspack.dev/rspress/rspress-logo-480x480.png',
  logoText: 'Rspress',
  icon: 'https://assets.rspack.dev/rspress/rspress-logo-480x480.png',
  markdown: {
    checkDeadLinks: true,
  },
  plugins: [
    pluginFontOpenSans(),
    pluginSitemap({
      domain: siteUrl,
    }),
    pluginAlgolia({
      verificationContent: '0F854AB11EB1D255',
    }),
    pluginShiki({
      langs: ['mdx', 'html'],
    }),
  ],
  builderConfig: {
    dev: {
      lazyCompilation: true,
    },
    plugins: [
      pluginSass(),
      pluginGoogleAnalytics({ id: 'G-66B2Z6KG0J' }),
      pluginOpenGraph({
        title: 'Rspress',
        type: 'website',
        url: siteUrl,
        image: 'https://rspress.dev/og-image.png',
        description: 'Rspack based static site generator',
        twitter: {
          site: '@rspack_dev',
          card: 'summary_large_image',
        },
      }),
    ],
  },
  search: false,
  route: {
    cleanUrls: true,
    exclude: ['**/fragments/**'],
  },
  themeConfig: {
    enableAppearanceAnimation: false,
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
      {
        icon: 'x',
        mode: 'link',
        content: 'https://x.com/rspack_dev',
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
        overview: {
          filterNameText: '过滤',
          filterPlaceholderText: '输入关键词',
          filterNoResultText: '未找到匹配的 API',
        },
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
  languageParity: {
    enabled: true,
    include: [],
    exclude: [],
  },
});
