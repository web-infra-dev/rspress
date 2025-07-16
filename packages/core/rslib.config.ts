import path from 'node:path';
import { pluginReact } from '@rsbuild/plugin-react';
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
  plugins: [pluginPublint()],
  lib: [
    generateEntry('./src/runtime.ts'),
    generateEntry('./src/theme.ts'),
    {
      format: 'esm',
      dts: {
        bundle: true,
      },
      syntax: 'es2022',
      shims: {
        esm: {
          require: true,
        },
      },
      source: {
        entry: {
          cli: './src/cli/index.ts',
        },
        define: {
          REQUIRE_CACHE: 'require.cache',
        },
      },
      output: {
        distPath: {
          root: './dist',
        },
        externals: {
          '../node/index': 'module ./index.js',
        },
      },
    },
    {
      format: 'esm',
      dts: {
        bundle: true,
      },
      syntax: 'es2022',
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
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
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
          './processor': 'module ./processor.js',
        },
      },
      source: {
        entry: {
          loader: './src/node/mdx/loader.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
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
      },
      source: {
        entry: {
          processor: './src/node/mdx/processor.ts',
        },
      },
    },
    {
      format: 'esm',
      syntax: 'es2022',
      dts: {
        bundle: true,
      },
      output: {
        target: 'web',
        distPath: {
          root: './dist',
        },
      },
      source: {
        entry: {
          'shiki-transformers':
            './src/node/mdx/rehypePlugins/transformers/index.ts',
        },
      },
    },
    {
      bundle: false,
      dts: true,
      format: 'esm',
      syntax: 'es2022',
      source: {
        entry: {
          index: './src/runtime/*.{tsx,ts}',
        },
        tsconfigPath: './src/runtime/tsconfig.json',
      },
      output: {
        target: 'web',
        distPath: {
          root: './dist/runtime',
        },
      },
      plugins: [pluginReact()],
    },
  ],
});
