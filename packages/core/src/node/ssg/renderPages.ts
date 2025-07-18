import type { UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import pMap from 'p-map';
import picocolors from 'picocolors';

import { hintSSGFailed } from '../logger/hint';
import type { RouteService } from '../route/RouteService';
import { renderHtmlTemplate } from './renderHtmlTemplate';
import { renderPage } from './renderPage';

const routePath2HtmlFileName = (routePath: string) => {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.html`;
  } else {
    fileName = `${routePath}.html`;
  }

  return fileName.replace(/^\/+/, '');
};

export async function renderPages(
  routeService: RouteService,
  config: UserConfig,
  ssrBundlePath: string,
  htmlTemplate: string,
  emitAsset: (assetName: string, content: string) => void,
) {
  logger.info('Rendering pages...');
  const startTime = Date.now();

  try {
    const routes = routeService.getRoutes();
    if (!routeService.isExistRoute('/404')) {
      // @ts-expect-error 404 page has no absolutePath attribute, so it is special
      routes.push({ routePath: '/404' });
    }
    await pMap(
      routes,
      async route => {
        const html = await renderPage(
          route,
          htmlTemplate,
          config,
          ssrBundlePath,
        );

        const fileName = routePath2HtmlFileName(route.routePath);
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
      const html = await renderHtmlTemplate(htmlTemplate, config, route, '');
      const fileName = routePath2HtmlFileName(route.routePath);
      emitAsset(fileName, html);
    }),
  );
}
