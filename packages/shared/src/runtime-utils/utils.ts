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

/**
 * Safe URI decoding function
 *
 * decodeURIComponent throws errors when encountering invalid URI encoding.
 * This function ensures successful decoding by intelligently identifying and fixing invalid % encodings.
 *
 * @param uri - The URI string to decode
 * @returns The decoded string
 *
 * @example
 * ```typescript
 * // Valid URI encoding - decode directly
 * safeDecodeURIComponent('/guide/%E4%B8%AD%E6%96%87') // '/guide/中文'
 * safeDecodeURIComponent('/guide/hello%20world') // '/guide/hello world'
 *
 * // Invalid % encoding - smart fix then decode
 * safeDecodeURIComponent('/guide/in%dex') // '/guide/in%25dex' -> '/guide/in%dex'
 * safeDecodeURIComponent('/guide/in%de') // '/guide/in%25de' -> '/guide/in%de'
 * safeDecodeURIComponent('/guide/test%') // '/guide/test%25' -> '/guide/test%'
 * ```
 *
 * Processing strategy:
 * 1. First attempt direct decoding, return result if successful
 * 2. If failed, check each %xx sequence individually:
 *    - Check if it's a valid hexadecimal format
 *    - Try to decode the specific %xx sequence
 *    - If decoding fails (e.g., invalid UTF-8 sequence), replace with %25xx
 *    - If format is incorrect, replace % with %25
 * 3. Finally decode the fixed string
 */
export function safeDecodeURIComponent(uri: string) {
  try {
    // Step 1: Attempt direct decoding - this handles all valid URI encodings
    return decodeURIComponent(uri);
  } catch {
    // Step 2: Direct decoding failed, need to identify and fix problematic sequences
    // Split the URI by '%' to process each potential encoding sequence separately
    const parts = uri.split('%');

    if (parts.length === 1) {
      // Edge case: No '%' found in string (shouldn't happen in normal flow)
      return uri;
    }

    // Start with the first part (before any '%' character)
    let result = parts[0];

    // Process each part that comes after a '%' character
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];

      if (part.length >= 2) {
        // Extract potential hex digits (first 2 characters)
        const hexPart = part.substring(0, 2);
        // Extract remaining characters after the hex part
        const remaining = part.substring(2);

        // Validate if the hex part contains exactly 2 valid hexadecimal characters
        if (/^[0-9A-Fa-f]{2}$/.test(hexPart)) {
          // Valid hex format found, test if this specific sequence can be decoded
          try {
            // Attempt to decode just this %xx sequence
            decodeURIComponent('%' + hexPart);
            // Success: this is a valid encoding, keep it unchanged
            result += '%' + hexPart + remaining;
          } catch {
            // Failure: valid hex format but invalid UTF-8 sequence (e.g., %de)
            // Replace the '%' with '%25' to escape it properly
            result += '%25' + hexPart + remaining;
          }
        } else {
          // Invalid hex format (e.g., %dx, %1g), escape the '%' character
          result += '%25' + part;
        }
      } else {
        // Less than 2 characters after '%' (e.g., %x, %), escape the '%' character
        result += '%25' + part;
      }
    }

    // Step 3: Decode the fixed string (should now be safe)
    return decodeURIComponent(result);
  }
}

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
  let { url: cleanUrl, hash } = parseUrl(safeDecodeURIComponent(url));

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
