import {
  createRspressBrowserRouter,
  PageContext,
  RouterProvider,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { useThemeState } from '@theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo } from 'react';
import { routes } from 'virtual-routes';
import type { Page } from './initPageData';

const head = createHead();

// eslint-disable-next-line import/no-commonjs

export function ClientApp({
  initialPageData = null as unknown as Page,
}: {
  initialPageData?: Page;
}) {
  const [theme, setTheme] = useThemeState();
  const basename = removeTrailingSlash(withBase('/'));
  const router = useMemo(
    () => createRspressBrowserRouter(routes, basename),
    [basename],
  );

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <PageContext.Provider
        value={useMemo(() => ({ data: initialPageData }), [initialPageData])}
      >
        <UnheadProvider head={head}>
          <RouterProvider router={router} />
        </UnheadProvider>
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
