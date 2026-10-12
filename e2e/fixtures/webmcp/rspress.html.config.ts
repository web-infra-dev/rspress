import { defineConfig } from '@rspress/core';
import config from './rspress.config';

export default defineConfig({
  ...config,
  outDir: 'dist-html',
  route: { ...config.route, cleanUrls: false },
});
