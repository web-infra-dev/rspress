import path from 'node:path';
import { RSPRESS_TEMP_DIR } from '@rspress/core';

export const PACKAGE_ROOT = path.join(import.meta.dirname, '..');
export const STATIC_DIR = path.join(PACKAGE_ROOT, 'static');

export const VIRTUAL_DEMO_DIR = path.join(
  process.cwd(),
  'node_modules',
  RSPRESS_TEMP_DIR,
  'virtual-demo',
);
