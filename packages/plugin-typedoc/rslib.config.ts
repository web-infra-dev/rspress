import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
        distPath: './dist/types',
      },
      format: 'esm',
      syntax: 'es2015',
      output: {
        distPath: {
          root: './dist/es',
        },
        sourceMap: { js: 'source-map' },
      },
    },
    {
      format: 'cjs',
      syntax: 'es2015',
      output: {
        distPath: {
          root: './dist/lib',
        },
        sourceMap: { js: 'source-map' },
      },
    },
  ],
});
