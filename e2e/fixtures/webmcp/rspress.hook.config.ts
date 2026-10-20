import path from 'node:path';
import config from './rspress.config';

export default {
  ...config,
  webMcp: false,
  outDir: 'dist-hook',
  globalUIComponents: [path.join(import.meta.dirname, 'HookHarness.tsx')],
};
