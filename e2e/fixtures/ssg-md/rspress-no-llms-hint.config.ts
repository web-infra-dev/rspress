import baseConfig from './rspress.config';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default {
  ...baseConfig,
  outDir: getTestOutDir('rspress-no-llms-hint.config.ts'),
  themeConfig: {
    ...baseConfig.themeConfig,
    llmsUI: {
      injectLlmsHint: false,
    },
  },
};
