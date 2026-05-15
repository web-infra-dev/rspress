import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      source: {
        entry: {
          index: 'src/index.ts',
        },
      },
      syntax: 'es2023',
      dts: {
        tsgo: true,
        bundle: true,
      },
    },
    {
      source: {
        entry: {
          utils: 'src/utils.ts',
        },
      },
      syntax: 'es2023',
      dts: {
        tsgo: true,
        bundle: true,
      },
    },
  ],
});
