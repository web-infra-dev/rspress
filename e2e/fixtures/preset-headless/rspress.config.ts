import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  preset: 'headless',
  root: path.join(import.meta.dirname, 'doc'),
  globalStyles: path.join(import.meta.dirname, 'styles/custom.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
});
