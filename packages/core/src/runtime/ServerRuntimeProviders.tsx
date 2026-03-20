import {
  PageContext,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import type { Unhead } from '@unhead/react/server';
import { UnheadProvider } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { StaticRouter } from 'react-router-dom';
import { ContentSourceContext } from './ContentSourceContext';
import type { Page } from './initPageData';

const DEFAULT_THEME = 'light';

export function ServerRuntimeProviders({
  children,
  initialPageData,
  head,
  routePath = initialPageData.routePath || '/',
  contentSource = null,
}: {
  children: ReactNode;
  initialPageData: Page;
  head: Unhead;
  routePath?: string;
  contentSource?: ReactNode;
}) {
  return (
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <PageContext.Provider value={{ data: initialPageData }}>
        <ContentSourceContext.Provider value={contentSource}>
          <StaticRouter
            location={withBase(routePath)}
            basename={removeTrailingSlash(withBase('/'))}
          >
            <UnheadProvider value={head}>{children}</UnheadProvider>
          </StaticRouter>
        </ContentSourceContext.Provider>
      </PageContext.Provider>
    </ThemeContext.Provider>
  );
}
