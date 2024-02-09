import path from 'path';
import { defineConfig } from 'rspress/config';
import { docPluginDemo } from './plugin';
import { pluginPreview } from '@rspress/plugin-preview';
// import { pluginPlayground } from '@rspress/plugin-playground';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    docPluginDemo(),
    pluginPreview({
      isMobile: true,
      iframeOptions: {
        framework: 'react'
      },
      iframePosition: 'fixed',
    }),
    // pluginPlayground(),
  ],
});
