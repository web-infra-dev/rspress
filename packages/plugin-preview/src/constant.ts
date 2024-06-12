import path from 'node:path';
import { RSPRESS_TEMP_DIR } from '@rspress/shared';

export const staticPath = path.join(__dirname, '..', 'static');

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
