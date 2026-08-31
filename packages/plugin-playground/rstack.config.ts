import { fileURLToPath } from 'node:url';
import { pluginReact } from '@rsbuild/plugin-react';
import { define } from 'rstack';
import { pluginPublint } from 'rsbuild-plugin-publint';

const typescriptPath = fileURLToPath(import.meta.resolve('@typescript/native'));

define.lib({
  plugins: [pluginPublint()],
  lib: [
    {
      source: {
        entry: { index: 'src/cli/index.ts' },
      },
      shims: {
        esm: {
          __dirname: true,
        },
      },
      output: {
        distPath: {
          root: 'dist/cli',
        },
        externals: ['@types/react', 'rspress'],
      },
      syntax: 'es2023',
      dts: {
        typescriptPath,
        bundle: true,
      },
    },
    {
      source: {
        entry: { index: 'src/web/index.ts' },
      },
      plugins: [pluginReact()],
      output: {
        externals: ['@types/react', 'rspress'],
        distPath: {
          root: 'dist/web',
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
