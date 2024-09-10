import { defineConfig } from '@rslib/core';

export default defineConfig({
  lib: [
    {
      format: 'cjs',
      syntax: 'es2020',
      //   dts: {
      //     bundle: true,
      //     distPath: 'dist-rslib',
      //   },
      output: {
        distPath: {
          root: 'dist-rslib',
        },
        target: 'node',
      },
      tools: {
        rspack: {
          module: {
            parser: {
              'javascript/auto': {
                wrappedContextRecursive: false,
              },
              javascript: {
                wrappedContextRecursive: false,
              },
              'javascript/dynamic': {
                wrappedContextRecursive: false,
              },
              'javascript/esm': {
                wrappedContextRecursive: false,
              },
            },
          },
        },
      },
    },
  ],
});
