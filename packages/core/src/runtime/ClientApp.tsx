import {
  BrowserRouter,
  PageContext,
  removeTrailingSlash,
  ThemeContext,
  useSite,
  withBase,
} from '@rspress/core/runtime';
import { useThemeState } from '@rspress/core/theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { useMemo, useState } from 'react';
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
  const { site } = useSite();

  return (
    <ThemeContext.Provider
      value={useMemo(() => ({ theme, setTheme }), [theme, setTheme])}
    >
      <PageContext.Provider
        value={useMemo(() => ({ data, setData }), [data, setData])}
      >
        <BrowserRouter
          basename={removeTrailingSlash(withBase('/'))}
          useTransitions={site.route.useTransitions}
        >
          <UnheadProvider head={head}>
            <App />
          </UnheadProvider>
        </BrowserRouter>
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
