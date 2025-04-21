import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    { bundle: true, syntax: 'es2020', format: 'esm', dts: { bundle: true } },
  ],
});
