import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'doc'),
  base: '/docs/',
  lang: 'en',
  locales: [{ lang: 'en' }, { lang: 'zh' }],
  route: {
    cleanUrls: true,
    localeRedirect: 'never',
  },
});
