import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  base: '/base/',
  root: path.join(import.meta.dirname, 'doc'),
  route: {
    cleanUrls: false,
  },
});
