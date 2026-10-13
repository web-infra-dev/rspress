import config from './rspress.default.config';

export default {
  ...config,
  themeConfig: { llmsUI: true },
  outDir: 'dist-hint-only',
};
