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
      syntax: 'es2015',
    },
  ],
});
