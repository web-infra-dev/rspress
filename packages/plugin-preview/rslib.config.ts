import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      source: {
        entry: {
          index: 'src/index.ts',
          utils: 'src/utils.ts',
        },
      },
      syntax: 'es2020',
      dts: {
        bundle: true,
      },
    },
  ],
});
