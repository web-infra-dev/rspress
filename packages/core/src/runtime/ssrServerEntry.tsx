import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import {
  createStaticHandler,
  createRspressStaticRouter,
  removeTrailingSlash,
  StaticRouterProvider,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { routes } from 'virtual-routes';

const DEFAULT_THEME = 'light';

function renderToHtml(app: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const passThrough = new PassThrough();
    const { pipe } = renderToPipeableStream(app, {
      // Why Infinity? https://github.com/facebook/react/pull/33027#issuecomment-3403958008
      progressiveChunkSize: Infinity,
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
  const basename = removeTrailingSlash(withBase('/'));
  const dataRoutes = [
    {
      id: 'rspress-app-shell',
      path: '/',
      children: routes.map((route, index) => ({
        id: `rspress-route-${index}`,
        path: route.path,
        loader: route.loader,
      })),
    },
  ];
  const handler = createStaticHandler(dataRoutes, { basename });
  const context = await handler.query(new Request(`http://rspress.local${withBase(routePath)}`));

  if (context instanceof Response) {
    throw new Error(`Unexpected static router response: ${context.status}`);
  }

  const router = createRspressStaticRouter(routes, context);

  const appHtml = await renderToHtml(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <UnheadProvider value={head}>
        <StaticRouterProvider router={router} context={context} />
      </UnheadProvider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
  };
}

export { routes };
