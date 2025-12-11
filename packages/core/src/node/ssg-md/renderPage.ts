import { pathToFileURL } from 'node:url';
import type { Route, RouteMeta } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { createHead, type Unhead } from '@unhead/react/server';
import picocolors from 'picocolors';

import { hintSSGFailed } from '../logger/hint';

interface MdSSRBundleExports {
  render: (pagePath: string, head: Unhead) => Promise<{ appMd: string }>;
  routes: Route[];
}

export async function renderPage(route: RouteMeta, ssrBundlePath: string) {
  let render: MdSSRBundleExports['render'];
  try {
    const { default: ssrExports } = await import(
      pathToFileURL(ssrBundlePath).toString()
    );
    render = await ssrExports.render;
  } catch (e) {
    if (e instanceof Error) {
      logger.error(
        `Failed to load SSG bundle: ${picocolors.yellow(ssrBundlePath)}: ${e.message}`,
      );
      logger.debug(e);
      hintSSGFailed();
    }
    throw e;
  }
  const head = createHead();
  const { routePath, absolutePath } = route;
  let appMd = '';
  if (render) {
    try {
      ({ appMd } = await render(routePath, head));
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          `Page "${picocolors.yellow(routePath)}" SSG-MD rendering failed.
${absolutePath ? picocolors.gray(`    File: ${absolutePath}\n`) : ''}    ${picocolors.gray(e.toString())}`,
        );
        throw e;
      }
    }
  }

  return appMd;
}
