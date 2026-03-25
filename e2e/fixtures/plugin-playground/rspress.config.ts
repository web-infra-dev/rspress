import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginPlayground } from '@rspress/plugin-playground';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  plugins: [pluginPlayground({ defaultRenderMode: 'playground' })],
});
