import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPreview } from '@rspress/plugin-preview';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc-no-iframe'),
  outDir: getTestOutDir('rspress.no-iframe.config.ts'),
  plugins: [
    pluginPreview({
      defaultPreviewMode: 'internal',
      defaultRenderMode: 'preview',
      previewLanguages: ['tsx'],
    }),
  ],
});
