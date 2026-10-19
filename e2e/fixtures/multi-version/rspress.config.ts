import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  globalUIComponents: [path.join(import.meta.dirname, 'Navigation.tsx')],
  route: {
    localeRedirect: 'never',
  },
  lang: 'en',
  base: '/base/',
  locales: [
    {
      lang: 'en',
      label: 'English',
    },
    {
      lang: 'zh',
      label: '简体中文',
    },
  ],
  multiVersion: {
    default: 'v1',
    versions: ['v1', 'v2'],
  },
});
