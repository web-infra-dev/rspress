import path from 'node:path';
import { defineConfig } from 'rspress/config';
import { pluginPreview } from '@rspress/plugin-preview';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  lang: 'zh',
  plugins: [
    pluginPreview(),
    pluginApiDocgen({
      entries: {
        button: path.join(__dirname, 'src/button.tsx'),
      },
    }),
  ],
});
