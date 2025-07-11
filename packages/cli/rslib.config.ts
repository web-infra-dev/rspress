import path from 'node:path';
import { defineConfig } from '@rslib/core';
import { pluginPublint } from 'rsbuild-plugin-publint';

function generateEntry(entryPath: string) {
  const entryName = path
    .basename(entryPath)
    .replace(path.extname(entryPath), '');
  return {
    dts: { bundle: true },
    source: {
      entry: {
        [entryName]: entryPath,
      },
    },
    format: 'esm',
    syntax: 'esnext',
  } as const;
}

export default defineConfig({
  lib: [
    generateEntry('./src/index.ts'),
    generateEntry('./src/core.ts'),
    generateEntry('./src/shiki-transformers.ts'),
    generateEntry('./src/config.ts'),
    generateEntry('./src/theme.ts'),
    generateEntry('./src/runtime.ts'),
  ],
  plugins: [pluginPublint()],
});
