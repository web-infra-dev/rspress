import nprogress from 'nprogress';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type RouteObject,
  useLoaderData,
  useNavigation,
} from 'react-router-dom';
import { App } from './App';
import { ErrorRoute } from './ErrorRoute';
import { PageContext } from './hooks/usePage';
import { usePages } from './hooks/usePages';
import { useSite } from './hooks/useSite';
import { useWebMcp } from './hooks/useWebMcp';
import { pathnameToRouteService } from './route';
import {
  defineTool,
  readPage,
  resolveInternalRoute,
  routePathField,
} from './webMcp/tools';
import type { Page } from './initPageData';
import { PAGE_ROUTE_ID, pageDataLoader } from './pageDataLoader';

nprogress.configure({ showSpinner: false });

function PageRoute() {
  const page = useLoaderData() as Page;
  const { state } = useNavigation();
  // Preserve PageContext.setData for custom themes, while new loader data
  // always takes precedence when a navigation commits.
  const [override, setOverride] = useState<{ source: Page; data: Page }>();
  const data = override?.source === page ? override.data : page;
  const setData = useCallback(
    (data: Page) => {
      setOverride({ source: page, data });
    },
    [page],
  );

  // Page data and its tools share the router's committed loader lifecycle.
  // This build-time condition never changes while the component is mounted.
  if (
    import.meta.env.ENABLE_WEBMCP &&
    !import.meta.env.SSR &&
    import.meta.env.WEBMCP_OPTIONS.markdown
  ) {
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
          if (!targetPage)
            throw new TypeError(`Unknown internal route: ${path}`);
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
        (_args, signal) => readPage(data, site.base, signal),
      ),
    );
  }

  useEffect(() => {
    if (state === 'idle') {
      return;
    }
    const timer = setTimeout(() => nprogress.start(), 200);
    return () => {
      clearTimeout(timer);
      nprogress.done();
    };
  }, [state]);

  return (
    <PageContext.Provider
      value={useMemo(() => ({ data, setData }), [data, setData])}
    >
      <App />
    </PageContext.Provider>
  );
}

export function createPageRoutes(): RouteObject[] {
  return [
    {
      id: PAGE_ROUTE_ID,
      // Keep Rspress' matching rules for .html, /index, case, and encoded paths.
      path: '*',
      loader: pageDataLoader,
      element: <PageRoute />,
      errorElement: <ErrorRoute />,
      hydrateFallbackElement: <></>,
    },
  ];
}
