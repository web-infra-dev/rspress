import { withBase } from './utils';
import { addTrailingSlash } from './utils';

/**
 * match the sidebar key in user config
 * @param pattern /zh/guide
 * @param currentPathname /base/zh/guide/getting-started
 */
export const matchSidebar = (
  pattern: string,
  currentPathname: string,
  base: string,
): boolean => {
  const prefix = withBase(pattern, base);
  if (prefix === currentPathname) {
    return true;
  }
  const prefixWithTrailingSlash = addTrailingSlash(prefix);
  if (currentPathname.startsWith(prefixWithTrailingSlash)) {
    return true;
  }

  // be compatible with api-extractor
  // '/api/react': [
  //   { link: '/api/react.use' }
  // ]
  const prefixWithDot = `${prefix}.`;
  return currentPathname.startsWith(prefixWithDot);
};
