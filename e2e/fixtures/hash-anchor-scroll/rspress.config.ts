import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  base: '/docs/',
  root: path.join(import.meta.dirname, 'doc'),
  globalUIComponents: [path.join(import.meta.dirname, 'Navigation.tsx')],
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    sidebar: {
      '/target': [
        {
          text: 'Target',
          link: '/target',
        },
      ],
    },
  },
});
