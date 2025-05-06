import { BrowserRouter, DataContext, ThemeContext } from '@rspress/runtime';
import type { PageData } from '@rspress/shared';
import { useThemeState } from '@theme';
import { UnheadProvider, createHead } from '@unhead/react/client';
import { useMemo, useState } from 'react';
import { App } from './App';

const head = createHead();

// eslint-disable-next-line import/no-commonjs

export function ClientApp({
  initialPageData = null as unknown as PageData,
}: { initialPageData?: PageData }) {
  const [data, setData] = useState(initialPageData);
  const [theme, setTheme] = useThemeState();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <DataContext.Provider
        value={useMemo(() => ({ data, setData }), [data, setData])}
      >
        <BrowserRouter>
          <UnheadProvider head={head}>
            <App />
          </UnheadProvider>
        </BrowserRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}
