import { defineConfig } from '@rspress/core';
import config from './rspress.config';

export default defineConfig({
  ...config,
  outDir: 'unused-build',
  builderConfig: {
    ...config.builderConfig,
    output: { distPath: 'default-build', cleanDistPath: false },
    environments: { web: { output: { distPath: 'default-build' } } },
  },
  sitemap: undefined,
});
