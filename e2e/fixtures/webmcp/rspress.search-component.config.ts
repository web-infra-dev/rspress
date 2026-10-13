import path from 'node:path';
import config from './rspress.config';

export default {
  ...config,
  outDir: 'dist-components',
  search: {
    searchHooks: path.join(import.meta.dirname, 'custom-theme/searchHooks.ts'),
  },
  themeDir: path.join(import.meta.dirname, 'custom-theme'),
};
