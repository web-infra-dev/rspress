import config from './rspress.config';

export default {
  ...config,
  themeConfig: { llmsUI: { injectLlmsHint: false } },
  outDir: 'dist-no-llms-hint',
};
