import path from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const COMMON_EXTERNALS = [
  'virtual-routes',
  'virtual-site-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  '@rspress/runtime',
  '@theme',
  /@theme-assets\//,
  'virtual-i18n-text',
  // To be externalized when bundling d.ts.
  '@types/react',
];

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          renderPageWorker: './src/node/ssg/renderPageWorker.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          cli: './src/cli/index.ts',
        },
      },
      output: {
        distPath: {
          root: './dist',
        },
        externals: {
          '../node/index': 'module ./index.js',
        },
      },
    },
    {
      format: 'esm',
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      syntax: 'es2022',
      output: {
        distPath: {
          root: './dist',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      output: {
        distPath: {
          root: './dist',
        },
        externals: {
          './processor': 'module ./processor.js',
        },
      },
      source: {
        entry: {
          loader: './src/node/mdx/loader.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      output: {
        distPath: {
          root: './dist',
        },
      },
      source: {
        entry: {
          processor: './src/node/mdx/processor.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      output: {
        target: 'web',
        distPath: {
          root: './dist',
        },
      },
      source: {
        entry: {
          'shiki-transformers': './src/shiki-transformers.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          runtime: './src/runtime.ts',
        },
      },
    },
    {
      bundle: false,
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
      },
    },
  ],
});
