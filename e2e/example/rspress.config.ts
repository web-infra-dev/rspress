import path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginPreview } from '@rspress/plugin-preview';
export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [pluginPreview()],
});
