import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [
    pluginTypeDoc({
      entryPoints: [
        path.join(import.meta.dirname, './src/index.ts'),
        path.join(import.meta.dirname, './src/middleware.ts'),
        path.join(import.meta.dirname, './src/raw-link.ts'),
      ],
    }),
  ],
});
