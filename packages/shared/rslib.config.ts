import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: false,
      syntax: 'es2023',
      source: {
        entry: {
          index: [
            'src/index.ts',
            'src/logger.ts',
            'src/fs-extra.ts',
            'src/chalk.ts',
            'src/execa.ts',
            'src/node-utils.ts',
          ],
        },
      },
    },
    {
      format: 'cjs',
      bundle: false,
      syntax: 'es2023',
      source: {
        entry: {
          index: [
            'src/index.ts',
            'src/logger.ts',
            'src/fs-extra.ts',
            'src/chalk.ts',
            'src/execa.ts',
            'src/node-utils.ts',
          ],
        },
      },
    },
  ],
  output: {
    distPath: {
      root: 'dist-rslib',
    },
  },
});
