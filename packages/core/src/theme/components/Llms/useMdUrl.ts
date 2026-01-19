import { routePathToMdPath, usePageData } from '@rspress/core/runtime';
import { useMemo } from 'react';

export function useMdUrl(): { pathname: string } {
  const { page } = usePageData();
  const mdPath = useMemo(() => {
    const pathname = routePathToMdPath(page.routePath);
    return { pathname };
  }, [page.routePath]);
  return mdPath;
}
