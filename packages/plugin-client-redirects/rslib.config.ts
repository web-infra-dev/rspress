import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      dts: {
        bundle: true,
      },
      syntax: 'es2023',
      shims: {
        esm: {
          __dirname: true,
        },
      },
    },
  ],
});
