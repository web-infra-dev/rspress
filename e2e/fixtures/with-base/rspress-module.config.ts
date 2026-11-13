import { defineConfig } from '@rspress/core';
import baseConfig from './rspress.config';

export default defineConfig({
  ...baseConfig,
  outDir: 'doc_build_module',
  llms: false,
  builderConfig: {
    environments: {
      web: {
        output: {
          module: true,
        },
      },
    },
  },
});
