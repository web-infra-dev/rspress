import {
  pathnameToRouteService,
  usePage,
  usePages,
  useSite,
  useWebMcp,
} from '@rspress/core/runtime';
import {
  defineTool,
  readPage,
  resolveInternalRoute,
  routePathField,
} from '../webMcp/tools';

/**
 * Registers `rspress_get_page` and `rspress_get_current_page` to read page
 * metadata and generated SSG-MD without navigating. The app registers these
 * tools when Markdown generation is enabled, independently of the theme UI.
 * @unstable
 */
export function useWebMcpPageReading() {
  const { page } = usePage();
  const { site } = useSite();
  const { pages } = usePages();
  useWebMcp(
    defineTool(
      'get_page',
      'Read metadata and generated Markdown for a known documentation route without navigating. Paths are relative to the site base.',
      { routePath: routePathField },
      ['routePath'],
      (args, signal) => {
        const target = resolveInternalRoute(args.routePath as string, {
          origin: window.location.origin,
          resolveRoute: pathname => pathnameToRouteService(pathname)?.path,
        });
        const path = pathnameToRouteService(
          new URL(target, window.location.origin).pathname,
        )?.path;
        const targetPage = pages.find(page => page.routePath === path);
        if (!targetPage) throw new TypeError(`Unknown internal route: ${path}`);
        return readPage(targetPage, site.base, signal);
      },
    ),
  );
  useWebMcp(
    defineTool(
      'get_current_page',
      'Read metadata, frontmatter, table of contents and generated Markdown for the current documentation page.',
      {},
      [],
      (_args, signal) => readPage(page, site.base, signal),
    ),
  );
}
