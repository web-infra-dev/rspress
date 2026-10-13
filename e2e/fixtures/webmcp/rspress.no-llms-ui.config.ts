import config from './rspress.config';

export default {
  ...config,
  themeConfig: { llmsUI: false },
  outDir: 'dist-no-llms-ui',
};
