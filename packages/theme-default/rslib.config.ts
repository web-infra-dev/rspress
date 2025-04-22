import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const COMMON_EXTERNALS = [
  'virtual-routes-ssr',
  'virtual-routes',
  'virtual-search-index-hash',
  'virtual-site-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  '@rspress/runtime',
  '@theme',
  /@theme-assets\//,
  'virtual-i18n-text',
  'virtual-prism-languages',
  // To be externalized when bundling d.ts.
  '@types/react',
];

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      dts: { bundle: true },
      plugins: [
        pluginReact(),
        pluginSvgr(),
        pluginSass(),
        pluginTypedCSSModules(),
      ],
      source: {
        define: {
          __WEBPACK_PUBLIC_PATH__: '__webpack_public_path__',
        },
        entry: {
          bundle: './src/index.ts',
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
        externals: COMMON_EXTERNALS,
        cssModules: {
          localIdentName: '[local]_[hash:hex:5]',
          namedExport: true,
          exportLocalsConvention: 'camelCaseOnly',
        },
        copy: {
          patterns: [
            {
              from: './.theme-entry.js',
              to: './index.js',
              context: __dirname,
            },
            {
              from: './.theme-entry.d.ts',
              to: './index.d.ts',
              context: __dirname,
            },
          ],
        },
      },
    },
    {
      source: {
        entry: {
          'source-build-plugin': './src/node/source-build-plugin.ts',
        },
      },
      format: 'esm',
      syntax: 'es2022',
      output: {
        distPath: {
          root: 'dist/node',
        },
        externals: ['tailwindcss'],
      },
    },
    // pre-built svg files
    {
      format: 'esm',
      syntax: 'es2022',
      bundle: false,
      plugins: [
        pluginReact(),
        pluginSvgr({ svgrOptions: { exportType: 'default' } }),
      ],
      source: {
        entry: {
          assets: ['src/assets'],
        },
      },
      output: {
        distPath: {
          root: 'dist/assets',
        },
      },
    },
  ],
});
