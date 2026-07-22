import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { siteConfig } from './siteConfig';

export default defineConfig({
  ...siteConfig,
  root: path.join(import.meta.dirname, 'doc'),
  builderConfig: {
    dev: {
      watchFiles: {
        paths: path.join(import.meta.dirname, 'siteConfig.ts'),
        type: 'restart',
      },
    },
  },
});
