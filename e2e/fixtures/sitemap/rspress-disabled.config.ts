import { defineConfig } from '@rspress/core';
import config from './rspress-legacy.config';

export default defineConfig({
  ...config,
  outDir: 'disabled-build',
  sitemap: false,
});
