import { fileURLToPath } from 'node:url';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
  plugins: [pluginPublint()],
  bundle: true,
  syntax: 'es2023',
  dts: {
    typescriptPath,
    bundle: true,
  },
});
