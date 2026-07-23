import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      dts: {
        typescriptPath,
      },
      syntax: 'es2023',
    },
    {
      source: {
        entry: {
          index: './src/runtime/*',
        },
      },
      outBase: './src',
      bundle: false,
      syntax: 'esnext',
      plugins: [pluginReact()],
      output: {
        externals: [
          '@rspress/core/theme',
          'react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        target: 'web',
      },
    },
  ],
});
