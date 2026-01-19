import { normalizeHref, usePageData, withBase } from '@rspress/core/runtime';
import { useMemo } from 'react';

/**
 * Convert route path to markdown file path
 */
function routePathToMdPath(routePath: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return withBase(url);
}

export function useMdUrl(): { pathname: string } {
  const { page } = usePageData();
  const mdPath = useMemo(() => {
    const pathname = routePathToMdPath(page.routePath);
    return { pathname };
  }, [page.routePath]);
  return mdPath;
}
