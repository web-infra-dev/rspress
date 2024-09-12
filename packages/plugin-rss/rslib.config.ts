import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2020',
    },
    {
      format: 'esm',
      syntax: 'es2020',
    },
  ],
  output: {
    distPath: {
      root: 'dist-rslib',
    },
    sourceMap: {
      js: 'source-map',
    },
    target: 'node',
  },
});
