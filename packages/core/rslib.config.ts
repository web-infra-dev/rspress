import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

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
      redirect: {
        dts: {
          extension: true,
        },
      },
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
          },
        ],
      },
    },
  ],
  source: {
    tsconfigPath: 'tsconfig.build.json',
  },
});
