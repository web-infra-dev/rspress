import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      source: {
        entry: {
          index: 'src/index.ts',
          utils: 'src/utils.ts',
        },
      },
      syntax: 'es2020',
      dts: {
        bundle: true,
      },
    },
  ],
});
