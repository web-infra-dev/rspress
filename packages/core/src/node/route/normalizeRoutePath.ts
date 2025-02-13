import { addLeadingSlash, addTrailingSlash, withBase } from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';

export const normalizeRoutePath = (
  routePath: string,
  base: string,
  lang: string,
  version: string,
  langs: string[],
  versions: string[],
  extensions: string[] = DEFAULT_PAGE_EXTENSIONS,
) => {
  const hasTrailSlash = routePath.endsWith('/');
  let versionPart = '';
  let langPart = '';
  let purePathPart = '';
  const parts: string[] = routePath.split('/').filter(Boolean);

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

  const extensionsWithoutDot = extensions.map(i => {
    return i.slice(1);
  });
  const cleanExtensionPattern = new RegExp(
    `\\.(${extensionsWithoutDot.join('|')})$`,
    'i',
  );

  let normalizedRoutePath = addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
  )
    // remove the extension
    .replace(cleanExtensionPattern, '')
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');

  // restore the trail slash
  if (hasTrailSlash) {
    normalizedRoutePath = addTrailingSlash(normalizedRoutePath);
  }

  return {
    routePath: withBase(normalizedRoutePath, base),
    lang: langPart || lang,
    version: versionPart || version,
  };
};
