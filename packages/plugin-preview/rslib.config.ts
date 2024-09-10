import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2020',
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib',
        },
        target: 'node',
      },
    },
    {
      format: 'cjs',
      syntax: 'es2020',
      source: {
        entry: {
          utils: './src/utils.ts',
        },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib',
        },
        target: 'node',
      },
    },
  ],
});
