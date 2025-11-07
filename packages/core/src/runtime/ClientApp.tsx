import { RouterProvider, ThemeContext } from '@rspress/core/runtime';
import { createBrowserRouter } from '@rspress/runtime';
import { useThemeState } from '@theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo } from 'react';
import { routes } from 'virtual-routes';
import { App } from './App';
import { initPageData } from './initPageData';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <App />,
      loader: async ({ request }) => {
        const { pathname } = new URL(request.url);
        const pageData = await initPageData(pathname);
        return pageData;
      },
      children: routes,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_partialHydration: true,
    },
  },
);

const head = createHead();

// eslint-disable-next-line import/no-commonjs

export function ClientApp() {
  const [theme, setTheme] = useThemeState();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <UnheadProvider head={head}>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </UnheadProvider>
    </ThemeContext.Provider>
  );
}
