import { normalizeHref, usePageData, withBase } from '@rspress/core/runtime';
import { useMemo } from 'react';

/**
 * Convert a route path to a markdown file path.
 * Used in SSG-MD mode to generate .md links instead of .html links.
 *
 * @param routePath - The route path to convert
 * @returns The markdown file path with .md extension
 *
 * @example
 * ```ts
 * routePathToMdPath('/guide/start/introduction')
 * // Returns: '/guide/start/introduction.md'
 *
 * routePathToMdPath('/api#section')
 * // Returns: '/api.md#section'
 * ```
 */
export function routePathToMdPath(routePath: string): string {
  let url: string = routePath;
  url = normalizeHref(url, false);
  url = url.replace(/\.html$/, '.md');
  return withBase(url);
}

/**
 * React hook that returns the markdown URL for the current page.
 * Useful for SSG-MD mode where pages are rendered as .md files.
 *
 * @returns An object containing the pathname of the current page as a .md file
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { pathname } = useLlms();
 *   // pathname will be like '/guide/start/introduction.md'
 *   return <a href={pathname}>View as Markdown</a>;
 * }
 * ```
 */
export function useLlms(): { pathname: string } {
  const { page } = usePageData();
  const mdPath = useMemo(() => {
    const pathname = routePathToMdPath(page.routePath);
    return { pathname };
  }, [page.routePath]);
  return mdPath;
}
