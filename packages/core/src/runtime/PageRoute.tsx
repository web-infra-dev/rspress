import nprogress from 'nprogress';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type RouteObject,
  useLoaderData,
  useNavigation,
} from 'react-router-dom';
import { App } from './App';
import { PageContext } from './hooks/usePage';
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
      hydrateFallbackElement: <></>,
    },
  ];
}
