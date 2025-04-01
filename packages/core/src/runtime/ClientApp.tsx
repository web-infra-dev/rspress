import { BrowserRouter, DataContext, ThemeContext } from '@rspress/runtime';
import type { PageData } from '@rspress/shared';
import { useThemeState } from '@theme';
import { useEffect, useMemo, useState } from 'react';
import { App } from './App';
import { initPageData } from './initPageData';

export function RootApp() {
  const [data, setData] = useState<PageData>(null as any);
  const [theme, setTheme] = useThemeState();

  useEffect(() => {
    initPageData(window.location.pathname).then(pageData => {
      setData(pageData);
    });
  }, []);

  const themeValue = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  const dataValue = useMemo(() => ({ data, setData }), [data, setData]);

  if (!data) {
    return <></>;
  }

  return (
    <ThemeContext.Provider value={themeValue}>
      <DataContext.Provider value={dataValue}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>
  );
}
