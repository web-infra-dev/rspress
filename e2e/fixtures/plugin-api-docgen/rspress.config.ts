import path from 'node:path';
import { pluginApiDocgen } from '@rspress/plugin-api-docgen';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  plugins: [
    pluginApiDocgen({
      entries: {
        button: './src/Button.ts',
      },
      apiParseTool: 'react-docgen-typescript',
    }),
  ],
});
