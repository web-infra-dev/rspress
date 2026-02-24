// biome-ignore lint/suspicious/noTsIgnore: bundleless
// @ts-expect-error

// @ts-expect-error in v7, StaticRouter is exported from the main entry, but in v6 it's exported from 'react-router-dom/server'
import { StaticRouter } from 'REACT_ROUTER_DOM_SERVER';
import { renderToMarkdownString } from '@rspress/core/_private/react';
import {
  PageContext,
  pathnameToRouteService,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import { App } from './App';
import { initPageData } from './initPageData';

const DEFAULT_THEME = 'light';

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
    appMd,
  };
}

export { routes } from 'virtual-routes';
