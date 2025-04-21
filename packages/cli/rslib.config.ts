import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  lib: [
    {
      dts: { bundle: true },
      format: 'esm',
      syntax: 'esnext',
    },
  ],
  plugins: [pluginPublint()],
});
