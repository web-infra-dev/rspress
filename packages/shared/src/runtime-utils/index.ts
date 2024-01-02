import { castArray, isArray, isUndefined, mergeWith } from 'lodash-es';
import { UserConfig } from '@/types';

export const QUERY_REGEXP = /\?.*$/s;
export const HASH_REGEXP = /#.*$/s;
export const MDX_REGEXP = /\.mdx?$/;
export const APPEARANCE_KEY = 'rspress-theme-appearance';
export const SEARCH_INDEX_NAME = 'search_index';
export const RSPRESS_TEMP_DIR = '.rspress';

export const DEFAULT_HIGHLIGHT_LANGUAGES = [
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['jsx', 'tsx'],
  'tsx',
  'json',
  'css',
  'scss',
  'less',
  ['xml', 'xml-doc'],
  'diff',
  'yaml',
  ['md', 'markdown'],
  ['mdx', 'tsx'],
  'bash',
];

export const isSCM = () => Boolean(process.env.BUILD_VERSION);

export const isProduction = () => process.env.NODE_ENV === 'production';

export const isDebugMode = () => Boolean(process.env.DOC_DEBUG);

export const cleanUrl = (url: string): string =>
  url.replace(HASH_REGEXP, '').replace(QUERY_REGEXP, '');

export function slash(str: string) {
  return str.replace(/\\/g, '/');
}

export function removeHash(str: string) {
  return str.replace(/#.*$/, '');
}

export function normalizePosixPath(id: string): string {
  const path = slash(id);
  const isAbsolutePath = path.startsWith('/');
  const parts = path.split('/');

  const normalizedParts = [];
  for (const part of parts) {
    if (part === '.' || part === '') {
      // Ignore "." and empty parts
      continue;
    } else if (part === '..') {
      // Go up one level for ".." part
      if (
        normalizedParts.length > 0 &&
        normalizedParts[normalizedParts.length - 1] !== '..'
      ) {
        normalizedParts.pop();
      } else if (isAbsolutePath) {
        // Preserve leading ".." in absolute paths
        normalizedParts.push('..');
      }
    } else {
      // Add other parts
      normalizedParts.push(part);
    }
  }

  let normalizedPath = normalizedParts.join('/');
  if (isAbsolutePath) {
    normalizedPath = `/${normalizedPath}`;
  }

  return normalizedPath;
}

export const inBrowser = () => !process.env.__SSR__;

export function addLeadingSlash(url: string) {
  return url.charAt(0) === '/' || url.startsWith('https') ? url : `/${url}`;
}

export function removeLeadingSlash(url: string) {
  return url.charAt(0) === '/' ? url.slice(1) : url;
}

export function addTrailingSlash(url: string) {
  return url.charAt(url.length - 1) === '/' ? url : `${url}/`;
}

export function removeTrailingSlash(url: string) {
  return url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
}

export function normalizeSlash(url: string) {
  return removeTrailingSlash(addLeadingSlash(normalizePosixPath(url)));
}

export function isExternalUrl(url = '') {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:')
  );
}

export function isDataUrl(url = '') {
  return /^\s*data:/i.test(url);
}

export function replaceLang(
  rawUrl: string,
  lang: {
    current: string;
    target: string;
    default: string;
  },
  version: {
    current: string;
    default: string;
  },
  base = '',
  cleanUrls = false,
) {
  let url = removeBase(rawUrl, base);
  // rspress.dev/builder + switch to en -> rspress.dev/builder/en/index.html
  if (!url) {
    url = cleanUrls ? '/index' : '/index.html';
  }

  if (url.endsWith('/')) {
    url += cleanUrls ? '/index' : '/index.html';
  }

  let versionPart = '';
  let langPart = '';
  let purePathPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.current && version.current !== version.default) {
    versionPart = parts.shift() || '';
  }

  // Should we remove the lang part?
  // The answer is as follows:
  if (lang.target !== lang.default) {
    langPart = lang.target;
    if (lang.current !== lang.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  purePathPart = parts.join('/') || '';

  if ((versionPart || langPart) && !purePathPart) {
    purePathPart = cleanUrls ? 'index' : 'index.html';
  }

  return withBase(
    addLeadingSlash(
      [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
    ),
    base,
  );
}

export function replaceVersion(
  rawUrl: string,
  version: {
    current: string;
    target: string;
    default: string;
  },
  base = '',
  cleanUrls = false,
) {
  let url = removeBase(rawUrl, base);
  // rspress.dev/builder + switch to en -> rspress.dev/builder/en/index.html
  if (!url) {
    url = cleanUrls ? '/index' : '/index.html';
  }
  let versionPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.target !== version.default) {
    versionPart = version.target;
    if (version.current !== version.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  let restPart = parts.join('/') || '';

  if (versionPart && !restPart) {
    restPart = cleanUrls ? 'index' : 'index.html';
  }

  return withBase(
    addLeadingSlash([versionPart, restPart].filter(Boolean).join('/')),
    base,
  );
}

export const omit = (obj: Record<string, unknown>, keys: string[]) => {
  const ret = { ...obj };
  for (const key of keys) {
    delete ret[key];
  }
  return ret;
};

export const parseUrl = (
  url: string,
): {
  url: string;
  hash: string;
} => {
  const [withoutHash, hash = ''] = url.split('#');
  return {
    url: withoutHash,
    hash,
  };
};

export function normalizeHref(url?: string, cleanUrls = false) {
  if (!url) {
    return '/';
  }
  if (isExternalUrl(url)) {
    return url;
  }

  // eslint-disable-next-line prefer-const
  let { url: cleanUrl, hash } = parseUrl(decodeURIComponent(url));

  const hasExt = cleanUrl.split('/').pop()?.includes('.');

  if (!cleanUrls && !cleanUrl.endsWith('.html') && !hasExt) {
    if (cleanUrl.endsWith('/')) {
      cleanUrl += 'index.html';
    } else {
      cleanUrl += '.html';
    }
  }

  if (cleanUrls && cleanUrl.endsWith('/')) {
    cleanUrl += 'index';
  }

  return addLeadingSlash(hash ? `${cleanUrl}#${hash}` : cleanUrl);
}

export function withoutLang(path: string, langs: string[]) {
  const langRegexp = new RegExp(`^\\/(${langs.join('|')})`);
  return addLeadingSlash(path.replace(langRegexp, ''));
}

export function withoutBase(path: string, base = '') {
  return addLeadingSlash(path).replace(normalizeSlash(base), '');
}

export function withBase(url = '/', base = ''): string {
  const normalizedUrl = addLeadingSlash(url);
  const normalizedBase = normalizeSlash(base);
  // Avoid adding base path repeatly
  return normalizedUrl.startsWith(normalizedBase)
    ? normalizedUrl
    : `${normalizedBase}${normalizedUrl}`;
}

export function removeBase(url: string, base: string) {
  return addLeadingSlash(url).replace(
    new RegExp(`^${normalizeSlash(base)}`),
    '',
  );
}

export function withoutHash(url: string) {
  return url.split('#')[0];
}

export const mergeDocConfig = (...configs: UserConfig[]): UserConfig =>
  mergeWith({}, ...configs, (target: UserConfig, source: UserConfig) => {
    const pair = [target, source];
    if (pair.some(isUndefined)) {
      // fallback to lodash default merge behavior
      return undefined;
    }
    if (pair.some(isArray)) {
      return [...castArray(target), ...castArray(source)];
    }
    // fallback to lodash default merge behavior
    return undefined;
  });
