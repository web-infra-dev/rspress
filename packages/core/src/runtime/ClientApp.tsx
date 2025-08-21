import { BrowserRouter, PageContext, ThemeContext } from '@rspress/runtime';
import { useThemeState } from '@theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo, useState } from 'react';
import siteData from 'virtual-site-data';
import { App } from './App';
import type { Page } from './initPageData';

const head = createHead();

// eslint-disable-next-line import/no-commonjs

export function ClientApp({
  initialPageData = null as unknown as Page,
}: {
  initialPageData?: Page;
}) {
  const [data, setData] = useState(initialPageData);
  const [theme, setTheme] = useThemeState();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <PageContext.Provider
        value={useMemo(() => ({ data, setData }), [data, setData])}
      >
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
          basename={siteData.base}
        >
          <UnheadProvider head={head}>
            <App />
          </UnheadProvider>
        </BrowserRouter>
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
