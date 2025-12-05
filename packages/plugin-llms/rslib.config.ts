import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';
import { defineConfig, rspack } from '@rslib/core';
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
      tools: {
        rspack: {
          plugins: [
            new rspack.BannerPlugin({
              banner: 'import "./index.css";',
              raw: true,
              include: /runtime\/index.js$/,
            }),
          ],
        },
      },
      bundle: true,
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
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
      experiments: {
        advancedEsm: true,
      },
      syntax: 'esnext',
    },
  ],
});
