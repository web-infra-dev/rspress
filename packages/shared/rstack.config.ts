import { fileURLToPath } from 'node:url';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
  dts: {
    typescriptPath,
    bundle: true,
  },
  syntax: 'es2023',
  source: {
    entry: {
      index: 'src/index.ts',
      logger: 'src/logger.ts',
      'node-utils': 'src/node-utils.ts',
      'gray-matter': 'src/grayMatter.ts',
      constants: 'src/constants.ts',
      'lodash-es': 'src/lodash-es.ts',
      'github-slugger': 'src/github-slugger.ts',
    },
  },
  plugins: [pluginPublint()],
  output: {
    externals: ['mdast-util-mdx-jsx'],
  },
});
