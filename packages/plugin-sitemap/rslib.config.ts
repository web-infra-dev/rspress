import { fileURLToPath } from 'node:url';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

export default defineConfig({
  plugins: [pluginPublint()],
  lib: [
    {
      bundle: true,
      syntax: 'es2023',
      dts: {
        typescriptPath,
        bundle: true,
      },
    },
  ],
});
