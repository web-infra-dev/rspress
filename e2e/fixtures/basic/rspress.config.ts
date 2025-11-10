import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'doc'),
  globalStyles: path.join(__dirname, 'styles/index.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'dom',
        content:
          '<a href="/zh"><img src="https://assets.rspack.rs/rspress/rspress-logo.svg" /></a>',
      },
    ],
  },
});
