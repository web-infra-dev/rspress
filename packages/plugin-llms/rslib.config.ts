import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      dts: {
        bundle: true,
      },
      source: {
        entry: {
          'runtime/index': './src/runtime/index.tsx',
        },
      },
      bundle: true,
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      plugins: [pluginReact()],
      output: {
        externals: [
          '@theme',
          '@rspress/core/theme',
          'react',
          '@types/react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        target: 'web',
      },
    },
    {
      dts: {
        bundle: true,
      },
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'esnext',
    },
  ],
});
