import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      bundle: true,
      syntax: 'es2022',
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      dts: {
        bundle: true,
      },
    },
  ],
});
