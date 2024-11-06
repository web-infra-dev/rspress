import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: false,
      },
      format: 'esm',
      syntax: 'esnext',
      output: {
        target: 'node',
      },
    },
  ],
});
