import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2020',
      source: {
        entry: { index: './src/cli/index.ts' },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/cli/cjs',
        },
        target: 'node',
      },
    },
    {
      format: 'esm',
      syntax: 'es2020',
      source: {
        entry: { index: './src/cli/index.ts' },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/cli/esm',
        },
        target: 'node',
      },
    },
    {
      format: 'cjs',
      syntax: 'es2020',
      source: {
        entry: { index: './src/web/index.ts' },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/web/cjs',
        },
        target: 'web',
      },
    },
    {
      format: 'esm',
      syntax: 'es2020',
      source: {
        entry: { index: './src/web/index.ts' },
      },
      output: {
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/web/esm',
        },
        target: 'web',
      },
    },
  ],
});
