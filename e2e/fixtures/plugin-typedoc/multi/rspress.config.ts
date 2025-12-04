import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginTypeDoc({
      entryPoints: [
        path.join(__dirname, './src/index.ts'),
        path.join(__dirname, './src/middleware.ts'),
        path.join(__dirname, './src/raw-link.ts'),
      ],
    }),
  ],
});
