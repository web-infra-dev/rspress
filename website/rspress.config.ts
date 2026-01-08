import fs from 'node:fs/promises';
import path from 'node:path';
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
  transformerRemoveNotationEscape,
} from '@shikijs/transformers';
import { pluginGoogleAnalytics } from 'rsbuild-plugin-google-analytics';
import { pluginOpenGraph } from 'rsbuild-plugin-open-graph';
import pluginFileTree from 'rspress-plugin-file-tree';
import pluginOg from 'rspress-plugin-og';

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
  locales: [
    {
      lang: 'zh',
      label: '中文',
    },
    {
      lang: 'en',
      label: 'English',
    },
  ],
  markdown: {
    shiki: {
      // "markdown" and "mdx" can contain any language, so it does not support lazy loading for now
      // @see https://github.com/shikijs/shiki/issues/853#issuecomment-2507237577
      langs: ['markdown', 'mdx', 'tsx', 'json', 'bash', 'yaml', 'ts', 'js'],
      transformers: [
        transformerNotationDiff(),
        transformerNotationErrorLevel(),
        transformerNotationHighlight(),
        transformerNotationFocus(),
        transformerCompatibleMetaHighlight(),
        transformerRemoveNotationEscape(),
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
      previewLanguages: ['tsx', 'jsx', 'mdx'],
      iframeOptions: {
        devPort: 7778,
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
    pluginFileTree(),
    pluginOg({
      domain: 'https://v2.rspress.rs',
      maxTitleSizePerLine: 28,
      async resvgOptions() {
        // fetch font files to og-fonts
        const fontDir = path.join(__dirname, './og-fonts');
        const fontFile = path.join(fontDir, 'wqy-microhei.ttc');
        const fontUrl =
          'https://github.com/anthonyfok/fonts-wqy-microhei/raw/cd82defe33ec0e86e628329f1b63049ef562c8e5/wqy-microhei.ttc';

        try {
          await fs.access(fontFile);
        } catch {
          await fs.mkdir(fontDir, { recursive: true });

          const res = await fetch(fontUrl, { redirect: 'follow' });
          if (!res.ok) {
            throw new Error(
              `Failed to download font: ${res.status} ${res.statusText}`,
            );
          }

          const arrayBuffer = await res.arrayBuffer();
          await fs.writeFile(fontFile, Buffer.from(arrayBuffer));
        }

        return {
          font: {
            loadSystemFonts: false,
            fontFiles: [fontFile],
          },
        };
      },
    }),
  ],
  builderConfig: {
    plugins: [
      pluginSass(),
      pluginGoogleAnalytics({ id: 'G-66B2Z6KG0J' }),
      pluginOpenGraph({
        url: siteUrl,
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
                reportDir: `./doc_build/diff-rsdoctor/${config.name}`,
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
  },
  languageParity: {
    enabled: false,
    include: [],
    exclude: [],
  },
  // FIXME: DataCloneError: pluginOg requires function clone between main thread and worker thread
  // ssg: {
  //   experimentalWorker: true,
  // },
  llms: true,
});
