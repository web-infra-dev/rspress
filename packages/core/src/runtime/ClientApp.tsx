import { BrowserRouter, DataContext, ThemeContext } from '@rspress/runtime';
import type { PageData } from '@rspress/shared';
import { useThemeState } from '@theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo, useState } from 'react';
import { base } from 'virtual-runtime-config';
import { App } from './App';

const head = createHead();

// eslint-disable-next-line import/no-commonjs

export function ClientApp({
  initialPageData = null as unknown as PageData,
}: {
  initialPageData?: PageData;
}) {
  const [data, setData] = useState(initialPageData);
  const [theme, setTheme] = useThemeState();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <DataContext.Provider
        value={useMemo(() => ({ data, setData }), [data, setData])}
      >
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
          basename={base}
        >
          <UnheadProvider head={head}>
            <App />
          </UnheadProvider>
        </BrowserRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}
