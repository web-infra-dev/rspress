import { usePage } from '../hooks/usePage';
import { usePages } from '../hooks/usePages';
import { useSite } from '../hooks/useSite';
import { useWebMcp } from '../hooks/useWebMcp';
import { pathnameToRouteService } from '../route';
import {
  defineTool,
  readPage,
  resolveInternalRoute,
  routePathField,
} from './tools';

export function PageTools() {
  const { page } = usePage();
  const { pages } = usePages();
  const { site } = useSite();
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
  return null;
}
