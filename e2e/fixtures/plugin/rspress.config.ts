import path from 'path';
import { defineConfig } from 'rspress/config';
import { docPluginDemo } from './plugin';
import { pluginPreview } from '@rspress/plugin-preview';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    docPluginDemo(),
    pluginPreview({
      isMobile: true,
      iframePosition: 'fixed',
    }),
  ],
});
