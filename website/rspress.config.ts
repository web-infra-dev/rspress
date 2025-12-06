import { pluginSass } from '@rsbuild/plugin-sass';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { defineConfig } from '@rspress/core';
import { transformerCompatibleMetaHighlight } from '@rspress/core/shiki-transformers';
import { pluginAlgolia } from '@rspress/plugin-algolia';
import { pluginPreview } from '@rspress/plugin-preview';
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

const commonRsdoctorConfig = {
  disableClientServer: true,
  output: {
    mode: 'brief' as const,
    options: {
      type: ['json'] as ('json' | 'html')[],
    },
  },
};

export default defineConfig({
  title: 'Rspress',
  description: 'Rsbuild based static site generator',
  lang: 'en',
  logo: 'https://assets.rspack.rs/rspress/rspress-logo.svg',
  logoText: 'Rspress',
  icon: 'https://assets.rspack.rs/rspress/rspress-logo.svg',
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
    pluginPreview({
      iframeOptions: {
        devPort: 7777,
      },
    }),
    pluginTwoslash(),
    // pluginFontOpenSans(), // removed this line for Rspress preview
    pluginSitemap({
      siteUrl,
    }),
    pluginAlgolia({
      verificationContent: '8F5BFE50E65777F1',
    }),
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
    tools: {
      rspack: config => {
        if (process.env.RSDOCTOR) {
          config.plugins?.push(
            new RsdoctorRspackPlugin({
              ...commonRsdoctorConfig,
              output: {
                ...commonRsdoctorConfig.output,
                ...(config.name === 'web' && { reportDir: './doc_build/web' }),
              },
            }),
          );
        }
        return config;
      },
    },
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
    editLink: {
      docRepoBaseUrl:
        'https://github.com/web-infra-dev/rspress/tree/main/website/docs',
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
      },
      {
        lang: 'en',
        label: 'English',
      },
      {
        lang: 'ru',
        label: 'Русский',
      },
    ],
  },
  languageParity: {
    enabled: false,
    include: [],
    exclude: [],
  },
  ssg: {
    experimentalWorker: true,
  },
  llms: true,
});
