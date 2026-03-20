import { pathnameToRouteService } from '@rspress/core/runtime';
import type { Unhead } from '@unhead/react/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { AppShell } from './AppShell';
import { initPageData } from './initPageData';
import { ServerRuntimeProviders } from './ServerRuntimeProviders';

async function preloadRoute(pathname: string) {
  const route = pathnameToRouteService(pathname);
  await route?.preload();
}

export async function render(
  routePath: string,
  head: Unhead,
): Promise<{ appMd: string }> {
  const initialPageData = await initPageData(routePath);
  await preloadRoute(routePath);

  const appMd = await renderToMarkdownString(
    <ServerRuntimeProviders initialPageData={initialPageData} head={head}>
      <AppShell />
    </ServerRuntimeProviders>,
  );

  return {
    appMd,
  };
}

export { routes } from 'virtual-routes';
