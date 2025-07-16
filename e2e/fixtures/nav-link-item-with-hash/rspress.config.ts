import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  route: {
    cleanUrls: true,
  },
  themeConfig: {
    hideNavbar: 'never',
    nav: [
      {
        text: 'PageA',
        link: '#pageA',
        position: 'right',
      },
      {
        text: 'PageB',
        link: '#pageB',
        position: 'right',
      },
      {
        text: 'PageC',
        link: '#pageC',
        position: 'right',
      },
    ],
  },
});
