import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  base: '/base/',
  root: path.join(__dirname, 'doc'),
  route: {
    cleanUrls: false,
  },
  markdown: {
    link: {
      checkDeadLinks: false,
    },
  },
});
