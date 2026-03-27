import path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  lang: 'zh',
  plugins: [
    pluginApiDocgen({
      entries: {
        button: './src/Button.ts',
      },
      apiParseTool: 'react-docgen-typescript',
    }),
  ],
});
