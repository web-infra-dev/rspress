import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
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
      banner: {
        js: 'import "./index.css"',
      },
      bundle: true,
      format: 'esm',
      plugins: [pluginReact(), pluginSass()],
      output: {
        externals: [
          '@theme',
          'react',
          '@types/react',
          'react/jsx-runtime',
          'react/jsx-dev-runtime',
        ],
        target: 'web',
        cssModules: {
          namedExport: true,
          exportLocalsConvention: 'camelCaseOnly',
        },
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
      syntax: 'esnext',
    },
  ],
});
