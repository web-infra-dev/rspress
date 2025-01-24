import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      source: {
        entry: { index: 'src/cli/index.ts' },
      },
      output: {
        distPath: {
          root: 'dist/cli/cjs',
        },
      },
      syntax: 'es2020',
    },
    {
      format: 'esm',
      source: {
        entry: { index: 'src/cli/index.ts' },
      },
      output: {
        distPath: {
          root: 'dist/cli/esm',
        },
        externals: ['@types/react'],
      },
      syntax: 'es2020',
      dts: { bundle: true },
    },
    {
      format: 'cjs',
      source: {
        entry: { index: 'src/web/index.ts' },
      },
      output: {
        distPath: {
          root: 'dist/web/cjs',
        },
      },
      syntax: 'es2020',
    },
    {
      format: 'esm',
      source: {
        entry: { index: 'src/web/index.ts' },
      },
      output: {
        externals: ['@types/react'],
        distPath: {
          root: 'dist/web/esm',
        },
      },
      syntax: 'es2020',
      dts: { bundle: true },
    },
  ],
});
