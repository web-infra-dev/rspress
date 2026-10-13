import path from 'node:path';
import config from './rspress.config';

export default {
  ...config,
  themeDir: path.join(import.meta.dirname, 'standalone-theme'),
  outDir: 'dist-custom-theme',
};
