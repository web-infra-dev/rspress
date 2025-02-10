import { pluginReact } from '@rsbuild/plugin-react';
import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'esm',
      dts: {
        bundle: true,
      },
      syntax: 'es2020',
      shims: {
        esm: {
          require: true,
        },
      },
      source: {
        define: {
          REQUIRE_CACHE: 'require.cache',
        },
      },
      output: {
        distPath: {
          root: './dist',
        },
        externals: [
          {
            'react-syntax-highlighter/dist/cjs/languages/prism/supported-languages':
              'commonjs react-syntax-highlighter/dist/cjs/languages/prism/supported-languages',
          },
          'react-syntax-highlighter/dist/cjs/languages/prism/supported-languages',
          '@rspress/mdx-rs',
          'jsdom',
          'tailwindcss',
          '@rspress/plugin-container-syntax',
        ],
      },
    },
    {
      format: 'esm',
      syntax: 'es2020',
      dts: {
        bundle: true,
      },
      shims: {
        esm: {
          require: true,
        },
      },
      output: {
        distPath: {
          root: './dist',
        },
        externals: {
          '@rspress/mdx-rs': 'commonjs @rspress/mdx-rs',
        },
      },
      source: {
        entry: {
          loader: './src/node/mdx/loader.ts',
        },
      },
    },
    {
      bundle: false,
      dts: true,
      format: 'esm',
      syntax: 'es2020',
      source: {
        entry: {
          index: './src/runtime/*',
        },
        tsconfigPath: './src/runtime/tsconfig.json',
      },
      output: {
        distPath: {
          root: './dist/runtime',
        },
      },
      plugins: [pluginReact()],
    },
  ],
});
