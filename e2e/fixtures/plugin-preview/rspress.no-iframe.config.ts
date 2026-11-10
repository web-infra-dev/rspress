import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc-no-iframe'),
  plugins: [
    pluginPreview({
      defaultPreviewMode: 'internal',
      defaultRenderMode: 'preview',
      previewLanguages: ['tsx'],
    }),
  ],
});
