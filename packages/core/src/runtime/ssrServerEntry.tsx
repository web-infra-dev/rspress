import {
  DataContext,
  ThemeContext,
  pathnameToRouteService,
} from '@rspress/runtime';
import { StaticRouter } from '@rspress/runtime/server';
import type { PageData } from '@rspress/shared';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import { renderToPipeableStream } from 'react-dom/server';

import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import type { ReactNode } from 'react';
import { base } from 'virtual-runtime-config';
import { App } from './App';
import { initPageData } from './initPageData';

const DEFAULT_THEME = 'light';

async function preloadRoute(pathname: string) {
  const route = pathnameToRouteService(pathname);
  await route?.preload();
}

function renderToHtml(app: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();
    const { pipe } = renderToPipeableStream(app, {
      onError(error) {
        reject(error);
      },
      onAllReady() {
        pipe(passThrough);
        text(passThrough).then(resolve, reject);
      },
    });
  });
}

export async function render(
  pagePath: string,
  head: Unhead,
): Promise<{ appHtml: string; pageData: PageData }> {
  const initialPageData = await initPageData(pagePath);
  await preloadRoute(pagePath);

  const appHtml = await renderToHtml(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <DataContext.Provider value={{ data: initialPageData }}>
        <StaticRouter location={pagePath} basename={base}>
          <UnheadProvider value={head}>
            <App />
          </UnheadProvider>
        </StaticRouter>
      </DataContext.Provider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
    pageData: initialPageData,
  };
}

export { routes } from 'virtual-routes';
