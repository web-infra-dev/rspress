import path from 'node:path';
import { pluginPlayground } from '@rspress/plugin-playground';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [pluginPlayground()],
});
