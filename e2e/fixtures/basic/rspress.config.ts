import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  globalStyles: path.join(import.meta.dirname, 'styles/index.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'dom',
        content:
          '<a href="/zh"><img src="https://assets.rspack.rs/rspress/rspress-logo.svg" style="width:300px;" /></a>',
      },
    ],
  },
});
