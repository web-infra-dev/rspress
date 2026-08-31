import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
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
