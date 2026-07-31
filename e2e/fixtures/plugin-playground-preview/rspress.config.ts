import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPlayground } from '@rspress/plugin-playground';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [
    pluginPreview({
      iframeOptions: {
        devPort: process.env.RSPRESS_IFRAME_DEV_PORT
          ? Number(process.env.RSPRESS_IFRAME_DEV_PORT)
          : undefined,
      },
    }),
    pluginPlayground(),
  ],
});
