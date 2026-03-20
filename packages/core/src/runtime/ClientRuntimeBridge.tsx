'use client';

import {
  BrowserRouter,
  PageContext,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { useThemeState } from '@theme';
import { createHead, UnheadProvider } from '@unhead/react/client';
import { type ReactNode, useMemo, useState } from 'react';
import { ContentSourceContext } from './ContentSourceContext';
import type { Page } from './initPageData';

const head = createHead();

export function ClientRuntimeBridge({
  children,
  initialPageData,
  contentSource = null,
}: {
  children: ReactNode;
  initialPageData: Page;
  contentSource?: ReactNode;
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
        <ContentSourceContext.Provider value={contentSource}>
          <BrowserRouter basename={removeTrailingSlash(withBase('/'))}>
            <UnheadProvider head={head}>{children}</UnheadProvider>
          </BrowserRouter>
        </ContentSourceContext.Provider>
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
