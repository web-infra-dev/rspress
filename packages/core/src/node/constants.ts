import {
  getDefaultDarkModeValue,
  isDarkModeSwitchEnabled,
  type DarkMode,
  type UserConfig,
} from '@rspress/shared';
import { createRequire } from 'node:module';
import path from 'node:path';
import { version } from '../../package.json';

const require = createRequire(import.meta.url);

export const RSPRESS_VERSION = version;

const APPEARANCE_KEY = 'rspress-theme-appearance';

export const isProduction = () => process.env.NODE_ENV === 'production';

// Keep the quotation marks consistent before and after.
export const importStatementRegex =
  /import\s+(.*?)\s+from\s+(['"])(.*?)(?:"|');?/gm;

// In the first render, the theme will be resolved before hydration.
// - Should be injected into both development and production modes
// - Class hooks are set for theme styles and user CSS frameworks
// - Style hook (colorScheme) is set for external use (CSS media queries or `light-dark()` function)
export const getInlineThemeScript = (darkMode: DarkMode | undefined) => {
  const defaultTheme = getDefaultDarkModeValue(darkMode);
  const shouldReadStorage = isDarkModeSwitchEnabled(darkMode);

  return `{
  const saved = ${shouldReadStorage ? `localStorage.getItem('${APPEARANCE_KEY}')` : 'null'}
  const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const defaultTheme = '${defaultTheme}'
  const theme = saved === 'light' || saved === 'dark' || saved === 'auto' ? saved : defaultTheme
  const isDark = theme === 'auto' ? preferDark : theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)
  document.documentElement.classList.toggle('rp-dark', isDark)
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'
}`
    .replace(/\n/g, ';')
    .replace(/\s{2,}/g, '');
};

const serializeInlineScriptData = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

// Resolve the locale before the first render to avoid showing content in the
// wrong language while waiting for React to hydrate.
export const getInlineLocaleRedirectScript = (config: UserConfig) => {
  const localeRedirect = config.route?.localeRedirect ?? 'auto';
  const defaultLang = config.lang || '';
  const locales = config.locales ?? config.themeConfig?.locales ?? [];

  if (localeRedirect === 'never' || !defaultLang || locales.length === 0) {
    return '';
  }

  const langs = locales.map(locale => locale.lang);
  const versions = config.multiVersion?.versions ?? [];
  const replaceLocationScript = `
  var newPathname = '/' + newPathSegments.join('/')
  var trailingSlash = newPathname !== '/' && cleanPathname.endsWith('/') ? '/' : ''
  window.location.replace(base + newPathname + trailingSlash + search)`;
  const redirectScript =
    localeRedirect === 'only-default-lang'
      ? `if (currentLang === defaultLang && langs.includes(targetLang) && targetLang !== defaultLang) {
        var newPathSegments = pathSegments.slice()
        newPathSegments.splice(langIndex, 0, targetLang)
        ${replaceLocationScript}
      }`
      : `if (langs.includes(targetLang) && targetLang !== currentLang) {
        var newPathSegments = pathSegments.slice()
        if (targetLang === defaultLang) {
          newPathSegments.splice(langIndex, 1)
        } else if (currentLang === defaultLang) {
          newPathSegments.splice(langIndex, 0, targetLang)
        } else {
          newPathSegments[langIndex] = targetLang
        }
        ${replaceLocationScript}
      }`;

  return `{
  var defaultLang = ${serializeInlineScriptData(defaultLang)}
  var langs = ${serializeInlineScriptData(langs)}
  var versions = ${serializeInlineScriptData(versions)}
  var botRegex = /bot|spider|crawl|lighthouse/i
  if (!botRegex.test(window.navigator.userAgent)) {
    var firstVisitKey = 'rspress-visited'
    var visited = localStorage.getItem(firstVisitKey)
    if (!visited) {
      localStorage.setItem(firstVisitKey, '1')
      var targetLang = window.navigator.language.split('-')[0]
      var { pathname, search } = window.location
      var base = ${serializeInlineScriptData(config.base ?? '/')}.replace(/\\/$/, '')
      var cleanPathname = base && pathname.startsWith(base) ? pathname.slice(base.length) || '/' : pathname
      var pathSegments = cleanPathname.split('/').filter(Boolean)
      var langIndex = versions.includes(pathSegments[0]) ? 1 : 0
      var currentLang = langs.includes(pathSegments[langIndex]) ? pathSegments[langIndex] : defaultLang
      ${redirectScript}
    }
  }
}`
    .replace(/\n/g, ';')
    .replace(/\s{2,}/g, '');
};

export const PACKAGE_ROOT = path.dirname(
  require.resolve('@rspress/core/package.json'),
);
export const DEFAULT_THEME = path.join(PACKAGE_ROOT, 'dist/theme');
export const EJECTED_THEME = path.join(PACKAGE_ROOT, 'dist/eject-theme');
export const TEMPLATE_PATH = path.join(PACKAGE_ROOT, 'index.html');

export const CSR_CLIENT_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'csrClientEntry.js',
);

export const SSR_CLIENT_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'ssrClientEntry.js',
);

export const SSR_SERVER_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'ssrServerEntry.js',
);

export const SSG_MD_SERVER_ENTRY = path.join(
  PACKAGE_ROOT,
  'dist',
  'runtime',
  'ssrMdServerEntry.js',
);

export const OUTPUT_DIR = 'doc_build';

export const APP_HTML_MARKER = '<!--<?- DOC_CONTENT ?>-->';
export const HEAD_MARKER = '<!--<?- HEAD ?>-->';
export const META_GENERATOR = '<!--<?- GENERATOR ?>-->';

export const DEFAULT_TITLE = 'Rspress';

export const PUBLIC_DIR = 'public';
// Prevent the risk of naming conflicts with the user's folders
export const NODE_SSG_BUNDLE_FOLDER = '__ssg__';
export const NODE_SSG_BUNDLE_NAME = 'rspress-ssg-entry.cjs';

export const NODE_SSG_MD_BUNDLE_FOLDER = '__ssg_md__';
export const NODE_SSG_MD_BUNDLE_NAME = 'rspress-ssg-md-entry.cjs';
