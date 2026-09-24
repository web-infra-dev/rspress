import { defineConfig } from '@rspress/core';
import config from './rspress.config';

export default defineConfig({
  ...config,
  outDir: 'default-build',
  sitemap: undefined,
});
