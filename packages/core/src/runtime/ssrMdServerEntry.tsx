import {
  createRspressStaticRouter,
  createStaticHandler,
  removeTrailingSlash,
  StaticRouterProvider,
  ThemeContext,
  withBase,
} from '@rspress/core/runtime';
import { type Unhead, UnheadProvider } from '@unhead/react/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { routes } from 'virtual-routes';

const DEFAULT_THEME = 'light';

export async function render(
  routePath: string,
  head: Unhead,
): Promise<{ appMd: string }> {
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
  const context = await handler.query(
    new Request(`http://rspress.local${withBase(routePath)}`),
  );

  if (context instanceof Response) {
    throw new Error(`Unexpected static router response: ${context.status}`);
  }

  const router = createRspressStaticRouter(routes, context);

  const appMd = await renderToMarkdownString(
    <ThemeContext.Provider value={{ theme: DEFAULT_THEME }}>
      <UnheadProvider value={head}>
        <StaticRouterProvider router={router} context={context} />
      </UnheadProvider>
    </ThemeContext.Provider>,
  );

  return {
    appMd,
  };
}

export { routes };
