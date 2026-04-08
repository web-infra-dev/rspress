import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

export default defineConfig({
  lib: [
    {
      dts: {
        bundle: true,
      },
      format: 'esm',
      experiments: {
        advancedEsm: true,
      },
      syntax: 'esnext',
    },
  ],
  source: {
    entry: {
      index: 'src/index.ts',
      logger: 'src/logger.ts',
      'node-utils': 'src/node-utils.ts',
      'gray-matter': 'src/grayMatter.ts',
      constants: 'src/constants.ts',
      'lodash-es': 'src/lodash-es.ts',
    },
  },
  plugins: [pluginPublint()],
  output: {
    externals: ['mdast-util-mdx-jsx'],
  },
});
