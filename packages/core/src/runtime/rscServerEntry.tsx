import {
  PageContext,
  pathnameToRouteService,
  removeTrailingSlash,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import { StaticRouter } from 'react-router-dom';
import { renderToReadableStream } from 'react-server-dom-rspack/server.edge';
import { App } from './App';
import { initPageData } from './initPageData';


const DEFAULT_THEME = 'light';

async function preloadRoute(pathname: string) {
  const route = pathnameToRouteService(pathname);
  return await route?.preload();
}

export async function renderToRscStream(
  routePath: string,
  head: Unhead,
): Promise<{
  rscStream: ReadableStream<Uint8Array>
  bootstrapScripts: string[]
}> {
  const initialPageData = await initPageData(routePath);
  await preloadRoute(routePath);

  return {
      rscStream: renderToReadableStream(
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
    ),
    bootstrapScripts: [],
  };
}

