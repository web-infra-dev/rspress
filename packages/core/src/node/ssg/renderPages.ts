import { pathToFileURL } from 'node:url';
import {
  type Unhead,
  createHead,
  transformHtmlTemplate,
} from '@unhead/react/server';

import type { PageData, Route, RouteMeta, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import pMap from 'p-map';
import picocolors from 'picocolors';
import {
  APP_HTML_MARKER,
  HEAD_MARKER,
  META_GENERATOR,
  RSPRESS_VERSION,
} from '../constants';

import { hintSSGFailed } from '../logger/hint';
import type { RouteService } from '../route/RouteService';
import { renderConfigHead } from './renderHead';

interface SSRBundleExports {
  render: (
    pagePath: string,
    head: Unhead,
  ) => Promise<{ appHtml: string; pageData: PageData }>;
  routes: Route[];
}

const routePath2HtmlFileName = (routePath: string) => {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.html`;
  } else {
    fileName = `${routePath}.html`;
  }

  return fileName.replace(/^\/+/, '');
};

async function getReplacedHtml(
  htmlTemplate: string,
  config: UserConfig,
  route: RouteMeta,
  appHtml: string = '',
) {
  const replacedHtmlTemplate = htmlTemplate
    // Don't use `string` as second param
    // To avoid some special characters transformed to the marker, such as `$&`, etc.
    .replace(APP_HTML_MARKER, () => appHtml)
    .replace(
      META_GENERATOR,
      () => `<meta name="generator" content="Rspress v${RSPRESS_VERSION}">`,
    )
    .replace(HEAD_MARKER, [await renderConfigHead(config, route)].join(''));
  return replacedHtmlTemplate;
}

export async function renderPages(
  routeService: RouteService,
  config: UserConfig,
  ssrBundlePath: string,
  htmlTemplate: string,
  emitAsset: (assetName: string, content: string) => void,
) {
  logger.info('Rendering pages...');
  const startTime = Date.now();

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

  try {
    const routes = routeService.getRoutes();
    if (!routeService.isExistRoute('/404')) {
      // @ts-expect-error 404 page has no absolutePath attribute, so it is special
      routes.push({ routePath: '/404' });
    }
    await pMap(
      routes,
      async route => {
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

        const replacedHtmlTemplate = await getReplacedHtml(
          htmlTemplate,
          config,
          route,
          appHtml,
        );

        const html = await transformHtmlTemplate(head, replacedHtmlTemplate);

        const fileName = routePath2HtmlFileName(routePath);
        emitAsset(fileName, html);
      },
      // https://github.com/facebook/docusaurus/blob/45065e8d2b5831117b8d69fec1be28f5520cf105/packages/docusaurus/src/ssg/ssgEnv.ts#L11
      {
        concurrency: process.env.RSPRESS_SSG_CONCURRENCY
          ? Number.parseInt(process.env.RSPRESS_SSG_CONCURRENCY, 10)
          : // Not easy to define a reasonable option default
            // Will still be better than Infinity
            // See also https://github.com/sindresorhus/p-map/issues/24
            32,
      },
    );

    const totalTime = Date.now() - startTime;
    logger.success(`Pages rendered in ${picocolors.yellow(totalTime)} ms.`);
  } catch (e: unknown) {
    if (e instanceof Error) {
      logger.error(`Pages render error: ${e.message}`);
      logger.debug(e);
      hintSSGFailed();
    }
    throw e;
  }
}

export async function renderCSRPages(
  routeService: RouteService,
  config: UserConfig,
  htmlTemplate: string,
  emitAsset: (assetName: string, content: string) => void,
) {
  const routes = routeService.getRoutes();
  if (!routeService.isExistRoute('/404')) {
    // @ts-expect-error 404 page
    routes.push({ routePath: '/404' });
  }

  await Promise.all(
    routes.map(async route => {
      const html = await getReplacedHtml(htmlTemplate, config, route, '');
      const fileName = routePath2HtmlFileName(route.routePath);
      emitAsset(fileName, html);
    }),
  );
}
