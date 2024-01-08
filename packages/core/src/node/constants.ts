import path from 'path';
import { fileURLToPath } from 'url';
import { RSPRESS_TEMP_DIR } from '@rspress/shared';

export const isProduction = () => process.env.NODE_ENV === 'production';

export const importStatementRegex = /import\s+(.*?)\s+from\s+['"](.*?)['"];?/gm;

// @ts-expect-error
const dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));

export const PACKAGE_ROOT = path.join(dirname, '..');

export const CLIENT_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'clientEntry.js',
);

export const SSR_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'ssrEntry.js',
);

export const OUTPUT_DIR = 'doc_build';

export const APP_HTML_MARKER = '<!--<?- DOC_CONTENT ?>-->';
export const HEAD_MARKER = '<!--<?- HEAD ?>-->';
export const META_GENERATOR = '<!--<?- GENERATOR ?>-->';
export const HTML_START_TAG = '<html';
export const BODY_START_TAG = '<body';

export const PUBLIC_DIR = 'public';
export const TEMP_DIR = path.join(
  process.cwd(),
  'node_modules',
  RSPRESS_TEMP_DIR,
);
