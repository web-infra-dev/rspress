import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      dts: {
        bundle: true,
        distPath: './dist/types',
      },
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'es2015',
      output: {
        distPath: {
          root: './dist/es',
        },
      },
    },
  ],
});
