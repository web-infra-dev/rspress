import path from 'node:path';
import { RSPRESS_TEMP_DIR } from '@rspress/core';

export const STATIC_DIR = path.join(__dirname, '..', 'static');

export const VIRTUAL_DEMO_DIR = path.join(
  process.cwd(),
  'node_modules',
  RSPRESS_TEMP_DIR,
  'virtual-demo',
);
