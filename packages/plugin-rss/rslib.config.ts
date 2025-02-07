import { type LibConfig, defineConfig } from '@rslib/core';

const base = {
  bundle: true,
  format: 'cjs',
  syntax: 'es2020',
} satisfies LibConfig;

export default defineConfig({
  lib: [
    {
      ...base,
      format: 'cjs',
      output: {
        filename: {
          js: '[name].cjs',
        },
      },
    },
    { ...base, format: 'esm', dts: { bundle: true } },
  ],
});
