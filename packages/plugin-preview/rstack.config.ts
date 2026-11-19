import { fileURLToPath } from 'node:url';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
  plugins: [pluginPublint()],
  lib: [
    {
      source: {
        entry: {
          index: 'src/index.ts',
        },
      },
      syntax: 'es2023',
      dts: {
        typescriptPath,
        bundle: true,
      },
    },
    {
      source: {
        entry: {
          utils: 'src/utils.ts',
        },
      },
      syntax: 'es2023',
      dts: {
        typescriptPath,
        bundle: true,
      },
    },
  ],
});
