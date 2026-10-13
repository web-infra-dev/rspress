import path from 'node:path';
import config from './rspress.config';

export default {
  ...config,
  outDir: 'dist-components',
  // The custom layout owns the hint so the test can unmount it independently.
  themeConfig: { llmsUI: { injectLlmsHint: false } },
  search: {
    searchHooks: path.join(import.meta.dirname, 'custom-theme/searchHooks.ts'),
  },
  themeDir: path.join(import.meta.dirname, 'custom-theme'),
};
