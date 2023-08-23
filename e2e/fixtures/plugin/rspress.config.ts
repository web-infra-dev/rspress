import path from 'path';
import { defineConfig } from 'rspress/config';
import { pluginPreview } from '@rspress/plugin-preview';
import { docPluginDemo } from './plugin';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    docPluginDemo(),
    pluginPreview({ isMobile: true, iframePosition: 'follow' }),
  ],
});
