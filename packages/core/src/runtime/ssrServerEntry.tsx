import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import {
  PageContext,
  pathnameToRouteService,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
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
        <StaticRouter
          location={withBase(routePath)}
          basename={removeTrailingSlash(withBase('/'))}
        >
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
