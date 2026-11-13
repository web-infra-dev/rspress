import { defineConfig } from '@rspress/core';
import moduleConfig from './rspress-module.config';

export default defineConfig({
  ...moduleConfig,
  outDir: 'doc_build_module_credentials',
  ssg: false,
  builderConfig: {
    ...moduleConfig.builderConfig,
    html: {
      crossorigin: 'use-credentials',
    },
    output: {
      assetPrefix: 'https://rspress-cdn.example.com/',
    },
  },
});
