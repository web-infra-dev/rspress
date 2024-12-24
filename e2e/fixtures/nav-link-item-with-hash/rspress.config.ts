import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  route: {
    cleanUrls: true,
  },
  themeConfig: {
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
    ],
  },
});
