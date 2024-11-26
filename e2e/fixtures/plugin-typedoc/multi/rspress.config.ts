import path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginTypeDoc } from '@rspress/plugin-typedoc';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginTypeDoc({
      entryPoints: [
        path.join('./src/index.ts'),
        path.join('./src/middleware.ts'),
      ],
    }),
  ],
});
