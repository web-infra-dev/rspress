import { defineConfig } from '@rspress/core';
import baseConfig from './rspress.config';
import { getTestOutDir } from '../../utils/getTestOutDir';

export default defineConfig({
  ...baseConfig,
  outDir: getTestOutDir(
    'rspress-auto-asset-prefix.config.ts',
    'doc_build_auto',
  ),
  ssg: false,
  builderConfig: {
    ...baseConfig.builderConfig,
    output: {
      ...baseConfig.builderConfig?.output,
      assetPrefix: 'auto',
    },
  },
});
