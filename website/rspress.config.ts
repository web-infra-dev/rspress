import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig } from '@rspress/core';
import { transformerCompatibleMetaHighlight } from '@rspress/core/shiki-transformers';
import { pluginAlgolia } from '@rspress/plugin-algolia';
import { pluginLlms } from '@rspress/plugin-llms';
import { pluginSitemap } from '@rspress/plugin-sitemap';
import { pluginTwoslash } from '@rspress/plugin-twoslash';
import {
  transformerNotationDiff,
  transformerNotationErrorLevel,
  transformerNotationFocus,
  transformerNotationHighlight,
} from '@shikijs/transformers';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';

// import { pluginFontOpenSans } from 'rspress-plugin-font-open-sans';

const siteUrl = 'https://v2.rspress.rs';

export default defineConfig({
  root: 'docs',
  title: 'Rspress',
  description: 'Rsbuild based static site generator',
  lang: 'en',
  logo: 'https://assets.rspack.rs/rspress/rspress-logo-480x480.png',
  logoText: 'Rspress',
  icon: 'https://assets.rspack.rs/rspress/rspress-logo-480x480.png',
  markdown: {
    shiki: {
      transformers: [
        transformerNotationDiff(),
        transformerNotationErrorLevel(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerCompatibleMetaHighlight(),
      ],
    },
    link: {
      checkDeadLinks: {
        excludes: ['/og-image.png', '/llms-full.txt'],
      },
    },
  },
  plugins: [
    pluginTwoslash(),
    // pluginFontOpenSans(), // removed this line for Rspress preview
    pluginSitemap({
      siteUrl,
    }),
    pluginAlgolia({
      verificationContent: '8F5BFE50E65777F1',
    }),
    pluginLlms(),
  ],
  builderConfig: {
    plugins: [
      pluginSass(),
      pluginGoogleAnalytics({ id: 'G-66B2Z6KG0J' }),
      pluginOpenGraph({
        url: siteUrl,
        image: 'https://rspress.rs/og-image.png',
        description: 'Rsbuild based static site generator',
        twitter: {
          site: '@rspack_dev',
          card: 'summary_large_image',
        },
      }),
    ],
  },
  route: {
    cleanUrls: true,
    exclude: ['**/fragments/**', 'components/**'],
  },
  themeConfig: {
    lastUpdated: process.env.NODE_ENV === 'production',
    footer: {
      message: '© 2023-present ByteDance Inc.',
    },
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
      {
        icon: 'npm',
        mode: 'link',
        content: 'https://www.npmjs.com/package/@rspress/core',
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
        label: '中文',
        editLink: {
          docRepoBaseUrl:
            'https://github.com/web-infra-dev/rspress/tree/main/website/docs',
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
            'https://github.com/web-infra-dev/rspress/tree/main/website/docs',
          text: '📝 Edit this page on GitHub',
        },
      },
    ],
  },
  languageParity: {
    enabled: false,
    include: [],
    exclude: [],
  },
});
