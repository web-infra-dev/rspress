import baseConfig from './rspress.config';

export default {
  ...baseConfig,
  themeConfig: {
    ...baseConfig.themeConfig,
    llmsUI: {
      injectLlmsHint: false,
    },
  },
};
