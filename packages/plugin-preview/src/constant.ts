import path from 'path';
import { RSPRESS_TEMP_DIR } from '@rspress/shared';

export const staticPath = path.join(__dirname, '..', 'static');

export const demoComponentPath = path.join(
  __dirname,
  '..',
  'dist',
  'virtual-demo.js',
);

export const demoBlockComponentPath = path.join(
  staticPath,
  'global-components',
  'DemoBlock.tsx',
);

export const virtualDir = path.join(
  process.cwd(),
  'node_modules',
  RSPRESS_TEMP_DIR,
  'virtual-demo',
);
