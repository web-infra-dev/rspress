import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import { ThemeContext } from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { StaticRouterProvider } from 'react-router-dom';
import { createServerRouter } from './createServerRouter';

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
  const { router, context } = await createServerRouter(routePath);

  const appHtml = await renderToHtml(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <UnheadProvider value={head}>
        <StaticRouterProvider
          router={router}
          context={context}
          hydrate={false}
        />
      </UnheadProvider>
    </ThemeContext.Provider>,
  );

  return {
    appHtml,
  };
}

export { routes } from 'virtual-routes';
