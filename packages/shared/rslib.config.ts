import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
      },
      format: 'cjs',
      syntax: 'esnext',
    },
    {
      format: 'esm',
      syntax: 'esnext',
    },
  ],
  source: {
    entry: {
      index: 'src/index.ts',
      logger: 'src/logger.ts',
      'node-utils': 'src/node-utils.ts',
      constants: 'src/constants.ts',
    },
  },
  output: {
    externals: ['mdast-util-mdx-jsx'],
  },
});
