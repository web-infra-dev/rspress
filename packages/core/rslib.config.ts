import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const EJECT_PREFIX = 'my-';

/**
 * Transform content to replace the default prefix with the eject prefix.
 * This is used when copying theme files to eject-theme directory.
 */
function transformPrefixForEject(content: string, filename: string): string {
  // For TypeScript/JavaScript files, replace the PREFIX constant value
  if (
    filename.endsWith('.ts') ||
    filename.endsWith('.tsx') ||
    filename.endsWith('.js')
  ) {
    return content.replace(
      /const PREFIX = 'rp-';/g,
      `const PREFIX = '${EJECT_PREFIX}';`,
    );
  }
  // For SCSS files, replace the $prefix variable value
  if (filename.endsWith('.scss')) {
    return content.replace(/\$prefix: 'rp-';/g, `$prefix: '${EJECT_PREFIX}';`);
  }
  return content;
}

const COMMON_EXTERNALS = [
  'virtual-routes',
  'virtual-site-data',
  'virtual-page-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  'virtual-i18n-text',
  '@rspress/runtime',
  '@theme',
  /@theme-assets\//,
  // To be externalized when bundling d.ts.
  '@types/react',
  '@rspress/core/runtime',
  '@rspress/core/theme',
  '@rspress/core/shiki-transformers',
  '@rspress/core/_private/react',
  '@rspress/shared',
  '@rspress/runtime',
];

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      source: {
        entry: {
          index: './src/index.ts',
          'cli/index': './src/cli/index.ts',
          'shiki-transformers': './src/shiki-transformers.ts',
          runtime: './src/runtime.ts',

          // TODO: should add entry by new URL parser in Rspack module graph
          'node/mdx/loader': './src/node/mdx/loader.ts',
          'node/ssg/renderPageWorker': './src/node/ssg/renderPageWorker.ts',
        },
      },
      dts: false,
      experiments: {
        advancedEsm: true,
      },
      performance: {
        buildCache: false,
      },
      output: {
        externals: COMMON_EXTERNALS,
        filenameHash: true,
      },
      tools: {
        rspack(config) {
          config.plugins.forEach(plugin => {
            if (plugin?.constructor.name === 'EsmLibraryPlugin') {
              // @ts-expect-error
              plugin.options = {
                preserveModules: path.resolve(
                  path.dirname(fileURLToPath(import.meta.url)),
                  './src',
                ),
              };
            }
          });
        },
        bundlerChain(chain, { CHAIN_ID }) {
          const rule = chain.module.rule(
            `Rslib:${CHAIN_ID.RULE.JS}-entry-loader`,
          );
          rule.uses.delete('rsbuild:lib-entry-module');
          rule.issuer({});
          rule.clear();
        },
      },
    },
    {
      bundle: false,
      dts: false,
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          index: './src/node/ssg-md/react/*.ts',
        },
      },
      output: {
        distPath: {
          root: './dist/_private/react',
        },
      },
    },
    {
      bundle: false,
      dts: false,
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          index: './src/runtime/*.{tsx,ts}',
        },
      },
      output: {
        target: 'web',
        distPath: {
          root: './dist/runtime',
        },
      },
      plugins: [pluginReact()],
    },
    {
      format: 'esm',
      bundle: false,
      dts: true,
      plugins: [
        pluginReact(),
        pluginSvgr({ svgrOptions: { exportType: 'default' } }),
        pluginSass(),
      ],
      source: {
        define: {
          __WEBPACK_PUBLIC_PATH__: '__webpack_public_path__',
        },
        entry: {
          index: ['./src/theme/**', '!./src/theme/tsconfig.json'],
        },
      },
      tools: {
        rspack: {
          output: {
            environment: {
              // For Circular import of "@theme", https://github.com/web-infra-dev/rsbuild/issues/2862
              const: false,
            },
          },
        },
      },
      output: {
        target: 'web',
        distPath: {
          root: './dist/theme',
        },
        externals: COMMON_EXTERNALS,
        copy: [
          {
            from: './theme/components',
            to: '../eject-theme/components',
            context: path.join(__dirname, 'src'),
            transform: (content: Buffer, absoluteFilename: string) => {
              const filename = path.basename(absoluteFilename);
              return transformPrefixForEject(content.toString(), filename);
            },
          },
          {
            from: './theme/constant.ts',
            to: '../eject-theme/constant.ts',
            context: path.join(__dirname, 'src'),
            transform: (content: Buffer, absoluteFilename: string) => {
              const filename = path.basename(absoluteFilename);
              return transformPrefixForEject(content.toString(), filename);
            },
          },
          {
            from: './theme/styles/_prefix.scss',
            to: '../eject-theme/styles/_prefix.scss',
            context: path.join(__dirname, 'src'),
            transform: (content: Buffer, absoluteFilename: string) => {
              const filename = path.basename(absoluteFilename);
              return transformPrefixForEject(content.toString(), filename);
            },
          },
        ],
      },
    },
  ],
});
