import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
      },
      format: 'esm',
      syntax: 'es2021',
      output: {
        sourceMap: { js: 'source-map' },
      },
    },
  ],
});
