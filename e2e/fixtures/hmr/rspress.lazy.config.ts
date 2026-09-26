import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { siteConfig } from './siteConfig.ts';

export default defineConfig({
  ...siteConfig,
  root: path.join(import.meta.dirname, 'doc'),
  themeDir: path.join(import.meta.dirname, 'theme-lazy'),
  i18nSourcePath: path.join(import.meta.dirname, 'i18n.json'),
  globalUIComponents: [path.join(import.meta.dirname, 'virtualProbe.tsx')],
  globalStyles: path.join(import.meta.dirname, 'global.css'),
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/web-infra-dev/rspress',
      },
    ],
  },
  search: {
    searchHooks: path.join(import.meta.dirname, 'searchHooks.tsx'),
  },
  builderConfig: {
    dev: {
      lazyCompilation: true,
    },
  },
});
