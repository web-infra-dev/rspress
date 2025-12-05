import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      source: {
        entry: {
          index: 'src/index.ts',
        },
      },
      syntax: 'es2022',
      dts: {
        bundle: true,
      },
    },
    {
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      source: {
        entry: {
          utils: 'src/utils.ts',
        },
      },
      syntax: 'es2022',
      dts: {
        bundle: true,
      },
    },
  ],
});
