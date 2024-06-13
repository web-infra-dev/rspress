import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  themeConfig: {
    enableContentAnimation: true,
  },
  root: path.join(__dirname, 'doc'),
});
