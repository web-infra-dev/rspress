import { BrowserRouter, DataContext, ThemeContext } from '@rspress/runtime';
import type { PageData } from '@rspress/shared';
import { useThemeState } from '@theme';
import { useMemo, useState } from 'react';
import { App } from './App';

// eslint-disable-next-line import/no-commonjs

export function ClientApp({
  initialPageData = null as PageData,
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
          <App />
        </BrowserRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}
