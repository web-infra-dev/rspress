import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginTypedCSSModules } from '@rsbuild/plugin-typed-css-modules';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const COMMON_EXTERNALS = [
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
  // To be externalized when bundling d.ts.
  '@types/react',
];

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      bundle: false,
      dts: {
        bundle: true,
      },
      plugins: [
        pluginReact(),
        pluginSvgr({ svgrOptions: { exportType: 'default' } }),
        pluginSass(),
        pluginTypedCSSModules(),
      ],
      source: {
        define: {
          __WEBPACK_PUBLIC_PATH__: '__webpack_public_path__',
        },
        entry: {
          index: ['./src/**'],
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
      },
    },
  ],
});
