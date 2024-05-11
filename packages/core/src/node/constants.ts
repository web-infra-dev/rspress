import path from 'path';
import { fileURLToPath } from 'url';
import { APPEARANCE_KEY, RSPRESS_TEMP_DIR } from '@rspress/shared';

export const isProduction = () => process.env.NODE_ENV === 'production';

// Keep the quotation marks consistent before and after.
export const importStatementRegex =
  /import\s+(.*?)\s+from\s+(['"])(.*?)(?:"|');?/gm;

// In the first render, the theme will be set according to the user's system theme
// - Should be injected into both development and production modes
// - Class hook (.dark) is set for internal use (Tailwind)
// - Style hook (colorScheme) is set for external use (CSS media queries or `light-dark()` function)
export const inlineThemeScript = `{
  const saved = localStorage.getItem('${APPEARANCE_KEY}')
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = !saved || saved === 'auto' ? preferDark : saved === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}`
  .replace(/\n/g, ';')
  .replace(/\s{2,}/g, '');

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

export const DEFAULT_TITLE = 'Rspress';

export const PUBLIC_DIR = 'public';
export const TEMP_DIR = path.join(
  process.cwd(),
  'node_modules',
  RSPRESS_TEMP_DIR,
);
