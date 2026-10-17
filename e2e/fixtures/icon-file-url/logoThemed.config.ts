import { defineConfig } from '@rspress/core';
import config from './logo.config';

export default defineConfig({
  ...config,
  outDir: 'doc_build_logo_themed',
  logo: {
    light: new URL('./assets/light/logo%20%231.svg', import.meta.url),
    dark: new URL('./assets/dark/logo%20%231.svg', import.meta.url).href,
  },
});
