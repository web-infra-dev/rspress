import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      syntax: 'es2023',
      //   dts: {
      //     bundle: true,
      //     distPath: 'dist-rslib',
      //   },
      output: {
        distPath: {
          root: 'dist-rslib',
        },
        target: 'node',
      },
    },
  ],
});
