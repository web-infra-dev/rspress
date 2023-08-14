import { removeLeadingSlash } from '@rspress/shared';

export function getPageKey(route: string) {
  const cleanRoute = removeLeadingSlash(route);
  return cleanRoute.replace(/\//g, '_').replace(/\.[^.]+$/, '') || 'index';
}
