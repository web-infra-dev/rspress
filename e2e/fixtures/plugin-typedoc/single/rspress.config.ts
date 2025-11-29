import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginTypeDoc({
      entryPoints: ['./src/index.ts'],
    }),
  ],
});
