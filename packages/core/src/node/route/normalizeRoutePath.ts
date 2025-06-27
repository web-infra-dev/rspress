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

export const normalizeRoutePath = (
  relativePath: string,
  lang: string,
  version: string,
  langs: string[],
  versions: string[],
  extensions: string[] = DEFAULT_PAGE_EXTENSIONS,
) => {
  const [versionPart, langPart, purePathPart] = getRoutePathParts(
    relativePath,
    lang,
    version,
    langs,
    versions,
  );
  const extensionsWithoutDot = extensions.map(i => i.slice(1));
  const cleanExtensionPattern = new RegExp(
    `\\.(${extensionsWithoutDot.join('|')})$`,
    'i',
  );

  const normalizedRoutePath = addLeadingSlash(
    [versionPart, langPart].filter(Boolean).join('/') +
      addLeadingSlash(purePathPart),
  )
    // remove the extension
    .replace(cleanExtensionPattern, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');

  return {
    routePath: normalizedRoutePath,
    lang: langPart || lang,
    version: versionPart || version,
  };
};
