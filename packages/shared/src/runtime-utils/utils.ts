export const QUERY_REGEXP = /\?.*$/s;
export const HASH_REGEXP = /#.*$/s;
export const MDX_OR_MD_REGEXP = /\.mdx?$/;
export const APPEARANCE_KEY = 'rspress-theme-appearance';
export const SEARCH_INDEX_NAME = 'search_index';
export const RSPRESS_TEMP_DIR = '.rspress';

export const DEFAULT_HIGHLIGHT_LANGUAGES = [
  ['js', 'javascript'],
  ['ts', 'typescript'],
  ['jsx', 'tsx'],
  ['xml', 'xml-doc'],
  ['md', 'markdown'],
  ['mdx', 'tsx'],
];

// TODO: these utils should be divided into node and runtime
export const isProduction = () => process.env.NODE_ENV === 'production';

export const isDebugMode = () => {
  if (!process.env.DEBUG) {
    return false;
  }
  const values = process.env.DEBUG?.toLocaleLowerCase().split(',') ?? [];
  return ['rsbuild', 'builder', '*'].some(key => values.includes(key));
};

export const isDevDebugMode = () => process.env.DEBUG === 'rspress-dev';

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
  return url.charAt(0) === '/' || isExternalUrl(url) ? url : `/${url}`;
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
  isPageNotFound = false,
) {
  let url = removeBase(rawUrl, base);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
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

  return addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
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
  isPageNotFound = false,
) {
  let url = removeBase(rawUrl, base);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
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

  return addLeadingSlash([versionPart, restPart].filter(Boolean).join('/'));
}

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
  if (url.startsWith('#')) {
    return url;
  }

  // eslint-disable-next-line prefer-const
  let { url: cleanUrl, hash } = parseUrl(decodeURIComponent(url));

  // 1. cleanUrls: false
  if (!cleanUrls) {
    if (!cleanUrl.endsWith('.html')) {
      if (cleanUrl.endsWith('/')) {
        cleanUrl += 'index.html';
      } else {
        cleanUrl += '.html';
      }
    }
  } else {
    // 2. cleanUrls: true
    if (cleanUrl.endsWith('.html')) {
      cleanUrl = cleanUrl.replace(/\.html$/, '');
    }
    if (cleanUrls && cleanUrl.endsWith('/index')) {
      cleanUrl = cleanUrl.replace(/\/index$/, '/');
    }
  }

  return addLeadingSlash(hash ? `${cleanUrl}#${hash}` : cleanUrl);
}

export function withoutLang(path: string, langs: string[]) {
  const langRegexp = new RegExp(`^\\/(${langs.join('|')})`);
  return addLeadingSlash(path.replace(langRegexp, ''));
}

export function withBase(url: string, base: string): string {
  const normalizedUrl = addLeadingSlash(url);
  const normalizedBase = normalizeSlash(base);
  // Avoid adding base path repeatedly
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
