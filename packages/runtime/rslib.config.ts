import { defineConfig } from '@rslib/core';

// Useless, in bundleless mode, all dependencies are treated as external.
const COMMON_EXTERNALS = [
  '@theme',
  'virtual-search-index-hash',
  'virtual-site-data',
  'virtual-global-styles',
  'virtual-global-components',
  'virtual-search-hooks',
  '@/runtime',
  '@runtime',
  'virtual-i18n-text',
  'virtual-prism-languages',
];

const CJS_EXTERNALS = ['virtual-routes-ssr', 'virtual-routes'];

export default defineConfig({
  lib: [
    {
      format: 'esm',
      bundle: false,
      syntax: 'es2020',
      source: {
        entry: {
          index: ['./src/**'],
        },
      },
      output: {
        externals: {
          ...COMMON_EXTERNALS.reduce((acc, name) => {
            acc[name] = `${name}`;
            return acc;
          }, {}),
          ...CJS_EXTERNALS.reduce((acc, name) => {
            acc[name] = `commonjs ${name}`;
            return acc;
          }, {}),
        },
        sourceMap: {
          js: 'source-map',
        },
        distPath: {
          root: 'dist-rslib/es',
        },
        target: 'node',
      },
    },
  ],
});
