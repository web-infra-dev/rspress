import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import {
  PageContext,
  pathnameToRouteService,
  ThemeContext,
  withBase,
} from '@rspress/runtime';
import { StaticRouter } from '@rspress/runtime/server';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import siteData from 'virtual-site-data';
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
  routePath: string,
  head: Unhead,
): Promise<{ appHtml: string }> {
  const initialPageData = await initPageData(routePath);
  await preloadRoute(routePath);

  const appHtml = await renderToHtml(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <PageContext.Provider value={{ data: initialPageData }}>
        <StaticRouter location={withBase(routePath)} basename={siteData.base}>
          <UnheadProvider value={head}>
            <App />
          </UnheadProvider>
        </StaticRouter>
      </PageContext.Provider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
  };
}

export { routes } from 'virtual-routes';
