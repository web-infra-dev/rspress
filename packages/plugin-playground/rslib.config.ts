import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      source: {
        entry: { index: 'src/cli/index.ts' },
      },
      shims: {
        esm: {
          __dirname: true,
        },
      },
      output: {
        distPath: {
          root: 'dist/cli',
        },
        externals: ['@types/react'],
      },
      syntax: 'es2022',
      dts: { bundle: true },
    },
    {
      format: 'esm',
      source: {
        entry: { index: 'src/web/index.ts' },
      },
      plugins: [pluginReact()],
      output: {
        externals: ['@types/react'],
        distPath: {
          root: 'dist/web',
        },
      },
      syntax: 'es2022',
      dts: { bundle: true },
    },
  ],
});
