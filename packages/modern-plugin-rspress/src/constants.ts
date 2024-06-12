import path from 'node:path';

export const PACKAGE_ROOT = path.join(__dirname, '..');

export const overviewComponentPath = path.join(
  PACKAGE_ROOT,
  'static',
  'global-components',
  'Overview.tsx',
);
