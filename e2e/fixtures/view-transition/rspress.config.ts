import * as path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  themeConfig: {
    enableContentAnimation: true,
  },
  root: path.join(__dirname, 'doc'),
});
