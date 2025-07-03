import { addLeadingSlash, addTrailingSlash } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';

export const getRoutePathParts = (
  relativePath: string,
  lang: string,
  version: string,
  langs: string[],
  versions: string[],
) => {
  const hasTrailSlash = relativePath.endsWith('/');

  let versionPart = '';
  let langPart = '';
  let purePathPart = '';

  const parts: string[] = relativePath.split('/').filter(Boolean);

  if (version) {
    const versionToMatch = parts[0];
    if (versions.includes(versionToMatch)) {
      if (versionToMatch !== version) {
        versionPart = versionToMatch;
      }
      parts.shift();
    }
  }

  if (lang) {
    const langToMatch = parts[0];
    if (langs.includes(langToMatch)) {
      if (langToMatch !== lang) {
        langPart = langToMatch;
      }
      parts.shift();
    }
  }

  purePathPart = parts.join('/');

  return [
    versionPart,
    langPart,
    // restore the trail slash
    hasTrailSlash ? addTrailingSlash(purePathPart) : purePathPart,
  ] as const;
};

/**
 *
 * @param relativePath "/v3/en/guide/getting-started.mdx" or "/v3/guide/getting-started.mdx" or "/en/guide/getting-started.mdx" or "/guide/getting-started.mdx"
 * @returns
 */
export const normalizeRoutePath = (
  relativePath: string,
  lang: string,
  version: string,
  langs: string[],
  versions: string[],
  extensions: string[] = DEFAULT_PAGE_EXTENSIONS,
) => {
  // 1. remove extension
  const extensionsWithoutDot = extensions.map(i => i.slice(1));
  const cleanExtensionPattern = new RegExp(
    `\\.(${extensionsWithoutDot.join('|')})$`,
    'i',
  );

  let routePath = relativePath
    .replace(cleanExtensionPattern, '')
    .replace(/\.html$/, '');

  // 2. remove /v3/en
  const [versionPart, langPart, purePathPart] = getRoutePathParts(
    routePath,
    lang,
    version,
    langs,
    versions,
  );

  // 3. remove index
  routePath = purePathPart.replace(/\/index$/, '/');
  if (routePath === 'index') {
    routePath = '';
  }

  const normalizedRoutePath = addLeadingSlash(
    [...[versionPart, langPart].filter(Boolean), routePath].join('/'),
  );

  return {
    pureRoutePath: `/${routePath}`,
    routePath: normalizedRoutePath,
    lang: langPart || lang,
    version: versionPart || version,
  };
};
