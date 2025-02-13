import { type LibConfig, defineConfig } from '@rslib/core';

const entries = {
  index: 'src/index.ts',
  logger: 'src/logger.ts',
  'node-utils': 'src/node-utils.ts',
  constants: 'src/constants.ts',
};

// TODO: Rslib only supports bundle one single entry point when multiple entry points are provided.
// https://github.com/web-infra-dev/rslib/blob/befb09a8b0a7dfd7f5c96aa53dd10255c315dc7e/packages/plugin-dts/src/index.ts#L76
// Using multiple libs as a workaround as of now.
const cjsLibs: LibConfig[] = Object.entries(entries).map(([name, entry]) => {
  return {
    dts: {
      bundle: true,
    },
    format: 'cjs',
    syntax: 'esnext',
    source: {
      entry: {
        [name]: entry,
      },
    },
  };
});

export default defineConfig({
  lib: [
    ...cjsLibs,
    {
      format: 'esm',
      syntax: 'esnext',
      source: {
        entry: entries,
      },
    },
  ],
});
