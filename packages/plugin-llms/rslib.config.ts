import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      dts: {
        typescriptPath,
        bundle: true,
      },
      source: {
        entry: {
          'runtime/index': './src/runtime/index.tsx',
        },
      },
      bundle: true,
      plugins: [pluginReact()],
      output: {
        externals: [
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
        typescriptPath,
        bundle: true,
      },
      source: {
        entry: {
          index: './src/index.ts',
        },
      },
      syntax: 'es2023',
    },
  ],
});
