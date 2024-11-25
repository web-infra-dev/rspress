import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
      },
      format: 'cjs',
      syntax: 'es2020',
    },
  ],
});
