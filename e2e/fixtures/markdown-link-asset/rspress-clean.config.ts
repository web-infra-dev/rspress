import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  base: '/base/',
  root: path.join(__dirname, 'doc'),
  route: {
    cleanUrls: true,
  },
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
