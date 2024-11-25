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
      },
    },
    {
      format: 'cjs',
      syntax: 'es2015',
      output: {
        distPath: {
          root: './dist/lib',
        },
      },
    },
  ],
});
