import path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(import.meta.dirname, 'docs'),
  base: '/docs/',
  outDir: 'doc_build_logo',
  logo: new URL('./assets/light/logo%20%231.svg', import.meta.url),
  builderConfig: {
    performance: {
      // The single and themed variants share the same fixture root.
      buildCache: false,
    },
  },
});
