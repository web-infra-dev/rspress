import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  themeConfig: {
    enableContentAnimation: true,
  },
  root: path.join(__dirname, 'doc'),
});
