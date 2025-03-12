import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      dts: true,
      format: 'esm',
      syntax: 'esnext',
    },
    {
      source: {
        entry: {
          index: './src/runtime/*',
        },
      },
      outBase: './src',
      bundle: false,
      format: 'esm',
      syntax: 'esnext',
      plugins: [pluginReact()],
      output: {
        externals: [
          '@theme',
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        target: 'web',
      },
    },
  ],
});
