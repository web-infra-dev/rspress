import { defineConfig } from '@rspress/core';
import baseConfig from './rspress.config';

export default defineConfig({
  ...baseConfig,
  outDir: 'doc_build_auto',
  ssg: false,
  builderConfig: {
    ...baseConfig.builderConfig,
    output: {
      ...baseConfig.builderConfig?.output,
      assetPrefix: 'auto',
    },
  },
});
