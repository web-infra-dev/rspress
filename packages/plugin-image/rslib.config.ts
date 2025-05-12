import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      source: {
        entry: { index: 'src/index.ts' },
      },
      shims: {
        esm: {
          __dirname: true,
        },
      },
      output: {
        externals: ['@types/react'],
      },
      syntax: 'es2022',
      dts: { bundle: true },
    },
  ],
});
