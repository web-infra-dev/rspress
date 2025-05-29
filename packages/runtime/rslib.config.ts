import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  lib: [
    {
      bundle: false,
      source: {
        entry: { index: ['src/**', '!src/**.test.ts'] },
      },
      dts: true,
      format: 'esm',
      syntax: 'es2022',
      output: {
        externals: [
          '@theme',
          'virtual-routes',
          'virtual-search-index-hash',
          'virtual-site-data',
          'virtual-global-styles',
          'virtual-global-components',
          'virtual-search-hooks',
          'virtual-i18n-text',
        ],
        filename: {
          js: '[name].js',
        },
      },
      redirect: {
        dts: {
          extension: true,
        },
      },
    },
  ],
  plugins: [pluginReact(), pluginPublint()],
});
