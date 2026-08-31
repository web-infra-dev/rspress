import { fileURLToPath } from 'node:url';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
  plugins: [pluginPublint()],
  dts: {
    typescriptPath,
    bundle: true,
  },
  syntax: 'es2023',
  shims: {
    esm: {
      __dirname: true,
    },
  },
});
