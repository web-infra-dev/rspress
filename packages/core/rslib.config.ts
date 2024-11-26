import { defineConfig } from '@rslib/core';
import { pluginReact } from '@rsbuild/plugin-react';

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
      output: {
        distPath: {
          root: './dist',
        },
        externals: [
          {
            'react-syntax-highlighter/dist/cjs/languages/prism/supported-languages':
              'commonjs react-syntax-highlighter/dist/cjs/languages/prism/supported-languages',
          },
          '@rspress/mdx-rs',
          'jsdom',
          'tailwindcss',
          '@rspress/plugin-container-syntax',
          '../compiled/globby/index.js',
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
        externals: [
          ({ request, dependencyType, contextInfo }: any, callback: any) => {
            if (/^(virtual-routes-ssr|virtual-routes)$/.test(request)) {
              // Externalize to a commonjs module using the request path
              return callback(
                null,
                `${dependencyType === 'commonjs' ? 'commonjs' : 'module-import'} ${request}`,
              );
            }

            callback();
          },
          // {
          //   'virtual-routes-ssr': 'commonjs virtual-routes-ssr',
          //   'virtual-routes': 'commonjs virtual-routes',
          // },
        ],
        distPath: {
          root: './dist/runtime',
        },
      },
      plugins: [pluginReact()],
    },
  ],
});
