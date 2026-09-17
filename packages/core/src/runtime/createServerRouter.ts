import { createStaticHandler, createStaticRouter } from 'react-router-dom';
import { createPageRoutes } from './PageRoute';
import { removeTrailingSlash, withBase } from './utils';

export async function createServerRouter(routePath: string) {
  const { query, dataRoutes } = createStaticHandler(createPageRoutes(), {
    basename: removeTrailingSlash(withBase('/')),
  });
  const context = await query(
    new Request(new URL(withBase(routePath), 'http://rspress.local')),
  );
  if (context instanceof Response) {
    throw new Error(
      `Unexpected response while rendering ${routePath}: ${context.status}`,
    );
  }
  // Surface loader failures to the SSG worker instead of emitting an error page.
  if (context.errors) {
    throw Object.values(context.errors)[0];
  }
  return { router: createStaticRouter(dataRoutes, context), context };
}
