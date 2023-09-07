import path from 'path';
import { defineConfig } from 'rspress/config';
import { pluginAnnotation } from '@rspress/plugin-annotation';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginAnnotation(),
  ],
});
