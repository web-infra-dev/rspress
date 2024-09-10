import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2020',
      //   dts: {
      //     bundle: true,
      //     distPath: 'dist-rslib',
      //   },
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
