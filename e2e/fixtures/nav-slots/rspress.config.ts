import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  themeConfig: {
    nav: [
      { text: 'R1', link: '/' },
      { text: 'L1', link: '/', position: 'left' },
      { text: 'R2', link: '/' },
      { text: 'L2', link: '/', position: 'left' },
    ],
  },
});
