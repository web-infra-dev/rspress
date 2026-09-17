import {
  createBrowserRouter,
  RouterProvider,
  removeTrailingSlash,
  ThemeContext,
  useSite,
  withBase,
} from '@rspress/core/runtime';
import { useThemeState } from '@rspress/core/theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo } from 'react';
import type { Page } from './initPageData';
import { PAGE_ROUTE_ID } from './pageDataLoader';
import { createPageRoutes } from './PageRoute';

const head = createHead();

export function createClientRouter(initialPageData?: Page) {
  return createBrowserRouter(createPageRoutes(), {
    basename: removeTrailingSlash(withBase('/')),
    hydrationData: initialPageData
      ? { loaderData: { [PAGE_ROUTE_ID]: initialPageData } }
      : undefined,
  });
}

export function ClientApp({
  router,
}: {
  router: ReturnType<typeof createClientRouter>;
}) {
  const [theme, setTheme] = useThemeState();
  const { site } = useSite();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <UnheadProvider head={head}>
        <RouterProvider
          router={router}
          useTransitions={site.route.useTransitions}
        />
      </UnheadProvider>
    </ThemeContext.Provider>
  );
}
