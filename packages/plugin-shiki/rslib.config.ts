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
      format: 'esm',
      syntax: 'es2021',
    },
    {
      bundle: false,
      format: 'esm',
      source: {
        entry: {
          shiki: 'src/shiki.scss',
        },
      },
      output: {
        target: 'web',
      },
      plugins: [pluginSass()],
    },
  ],
});
