import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginTypeDoc({
      entryPoints: [
        path.join('./src/index.ts'),
        path.join('./src/middleware.ts'),
        path.join('./src/raw-link.ts'),
      ],
    }),
  ],
});
