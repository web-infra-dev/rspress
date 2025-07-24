import { pathToFileURL } from 'node:url';
import type { PageData, Route, RouteMeta, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import {
  createHead,
  transformHtmlTemplate,
  type Unhead,
} from '@unhead/react/server';
import picocolors from 'picocolors';

import { hintSSGFailed } from '../logger/hint';
import { renderHtmlTemplate } from './renderHtmlTemplate';

interface SSRBundleExports {
  render: (
    pagePath: string,
    head: Unhead,
  ) => Promise<{ appHtml: string; pageData: PageData }>;
  routes: Route[];
}

export async function renderPage(
  route: RouteMeta,
  htmlTemplate: string,
  configHead: UserConfig['head'],
  ssrBundlePath: string,
) {
  let render: SSRBundleExports['render'];
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
  const { routePath } = route;
  let appHtml = '';
  if (render) {
    try {
      ({ appHtml } = await render(routePath, head));
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          `Page "${picocolors.yellow(routePath)}" SSG rendering failed.\n    ${picocolors.gray(e.toString())}`,
        );
        throw e;
      }
    }
  }

  const replacedHtmlTemplate = await renderHtmlTemplate(
    htmlTemplate,
    configHead,
    route,
    appHtml,
  );

  const html = await transformHtmlTemplate(head, replacedHtmlTemplate);
  return html;
}
