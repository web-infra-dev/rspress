import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2020',
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/es',
        },
        target: 'node',
      },
    },
    {
      format: 'cjs',
      syntax: 'es2020',
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/lib',
        },
        target: 'node',
      },
    },
  ],
});
