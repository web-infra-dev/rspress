import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
      },
      format: 'cjs',
      syntax: 'es2020',
      output: {
        externals: {
          // TODO: 
          '@rspress/core': 'import @rspress/core',
        },
        target: 'node',
        sourceMap: { js: 'source-map' },
      },
    },
  ],
});
