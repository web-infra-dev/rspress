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
  // React Router otherwise uses "default" for every directly loaded document,
  // causing their saved scroll positions to share the same sessionStorage key.
  if (!window.history.state?.key) {
    window.history.replaceState(
      { ...window.history.state, key: Math.random().toString(36).slice(2, 10) },
      '',
    );
  }

  return createBrowserRouter(
    createPageRoutes({ restoreOnHydration: Boolean(initialPageData) }),
    {
      basename: removeTrailingSlash(withBase('/')),
      hydrationData: initialPageData
        ? { loaderData: { [PAGE_ROUTE_ID]: initialPageData } }
        : undefined,
    },
  );
}

export function ClientApp({
  router,
}: {
  router: ReturnType<typeof createClientRouter>;
}) {
  const [theme, setTheme] = useThemeState();
  const { site } = useSite();
  const transitionOptions = {
    useTransitions: site.route.useTransitions,
    // React Router 6 uses this flag for updates after async loaders complete.
    future: { v7_startTransition: site.route.useTransitions },
  };

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <UnheadProvider head={head}>
        <RouterProvider router={router} {...transitionOptions} />
      </UnheadProvider>
    </ThemeContext.Provider>
  );
}
