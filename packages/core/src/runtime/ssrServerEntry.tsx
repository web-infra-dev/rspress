import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import { pathnameToRouteService } from '@rspress/core/runtime';
import type { UserConfig } from '@rspress/shared';
import type { Unhead } from '@unhead/react/server';
import type { ReactNode } from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { AppShell } from './AppShell';
import { initPageData } from './initPageData';
import { ServerRuntimeProviders } from './ServerRuntimeProviders';
import type { SSRRender } from './ssrRender';

async function preloadRoute(pathname: string) {
  const route = pathnameToRouteService(pathname);
  await route?.preload();
}

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

export const render: SSRRender = async (
  routePath: string,
  head: Unhead,
  _configHead?: UserConfig['head'],
) => {
  const initialPageData = await initPageData(routePath);
  await preloadRoute(routePath);

  const appHtml = await renderToHtml(
    <ServerRuntimeProviders initialPageData={initialPageData} head={head}>
      <AppShell />
    </ServerRuntimeProviders>,
  );

  return {
    appHtml,
  };
};

export { routes } from 'virtual-routes';
