import type { RouteMeta, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { chunk } from 'lodash-es';
import pMap from 'p-map';
import picocolors from 'picocolors';

import { hintSSGFailed } from '../logger/hint';
import type { RouteService } from '../route/RouteService';
import { renderHtmlTemplate } from './renderHtmlTemplate';
import { renderPage } from './renderPage';
import {
  getNumberOfThreads,
  SSGConcurrency,
  SSGWorkerThreadRecyclerMaxMemory,
  SSGWorkerThreadTaskSize,
} from './ssgEnv';

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
  emitAsset: (assetName: string, content: string | Buffer) => void,
) {
  logger.info('Rendering pages...');
  const startTime = Date.now();
  const ssg = config.ssg || true;

  try {
    const routes = routeService.getRoutes();
    if (!routeService.isExistRoute('/404')) {
      // @ts-expect-error 404 page has no absolutePath attribute, so it is special
      routes.push({ routePath: '/404' });
    }

    if (
      typeof ssg === 'object' &&
      Array.isArray(ssg?.experimentalExcludeRoutePaths) &&
      ssg.experimentalExcludeRoutePaths.length > 0
    ) {
      const shouldIgnoreRoutePaths: Set<string> = new Set();
      const shouldIgnoreRoutePathsRegExp: RegExp[] = [];

      for (const routePath of ssg.experimentalExcludeRoutePaths) {
        if (typeof routePath === 'string') {
          shouldIgnoreRoutePaths.add(routePath);
        } else if (routePath instanceof RegExp) {
          shouldIgnoreRoutePathsRegExp.push(routePath);
        }
      }

      const promiseList: Promise<void>[] = [];
      const csrRoutes: RouteMeta[] = [];
      const ssgRoutes: RouteMeta[] = [];
      for (const route of routes) {
        if (
          shouldIgnoreRoutePaths.has(route.routePath) ||
          shouldIgnoreRoutePathsRegExp.some(reg => reg.test(route.routePath))
        ) {
          csrRoutes.push(route);
          promiseList.push(
            renderCSRPage(config.head, route, htmlTemplate, emitAsset),
          );
        } else {
          ssgRoutes.push(route);
        }
      }
      if (csrRoutes.length > 0) {
        logger.warn(
          `Some routes are ignored in SSG and fallback to CSR via \`ssg.experimentalExcludeRoutePaths\`: ${picocolors.yellow(
            csrRoutes.map(r => r.routePath).join(', '),
          )}`,
        );
        await Promise.all(promiseList);
        routes.length = 0;
        routes.push(...ssgRoutes);
      }
    }

    if (typeof ssg === 'object' && ssg?.experimentalWorker) {
      const numberOfThreads = getNumberOfThreads(routes.length);
      const Tinypool = await import('tinypool').then(m => m.default);

      const pool = new Tinypool({
        filename: new URL('./renderPageWorker.js', import.meta.url).href,
        // chunk tasks manually
        concurrentTasksPerWorker: 1,
        minThreads: numberOfThreads,
        maxThreads: numberOfThreads,
        /**
         * https://github.com/facebook/docusaurus/blob/0306d182407bb98f140cd5ec7481fa9608fe0297/packages/docusaurus/src/ssg/ssgExecutor.ts#L123
         * @license MIT
         */
        maxMemoryLimitBeforeRecycle: SSGWorkerThreadRecyclerMaxMemory(),
        isolateWorkers: false,
        workerData: {
          params: {
            htmlTemplate,
            head: config.head,
            ssrBundlePath,
          },
        },
      });

      await Promise.all(
        chunk(routes, SSGWorkerThreadTaskSize()).map(async routes => {
          const htmlList = await pool.run({ routes });
          for (let i = 0; i < routes.length; i++) {
            const route = routes[i];
            const html = htmlList[i];
            const fileName = routePath2HtmlFileName(route.routePath);
            emitAsset(fileName, html);
          }
        }),
      );

      await pool.destroy();
    } else {
      await pMap(
        routes,
        async route => {
          const html = await renderPage(
            route,
            htmlTemplate,
            config.head,
            ssrBundlePath,
          );

          const fileName = routePath2HtmlFileName(route.routePath);
          emitAsset(fileName, html);
        },
        {
          concurrency: SSGConcurrency(),
        },
      );
    }

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

async function renderCSRPage(
  head: UserConfig['head'],
  route: RouteMeta,
  htmlTemplate: string,
  emitAsset: (assetName: string, content: string | Buffer) => void,
) {
  const html = await renderHtmlTemplate(htmlTemplate, head, route, '');
  const fileName = routePath2HtmlFileName(route.routePath);
  emitAsset(fileName, html);
}

export async function renderCSRPages(
  routeService: RouteService,
  config: UserConfig,
  htmlTemplate: string,
  emitAsset: (assetName: string, content: string | Buffer) => void,
) {
  const routes = routeService.getRoutes();
  if (!routeService.isExistRoute('/404')) {
    // @ts-expect-error 404 page is special
    routes.push({ routePath: '/404' });
  }

  await Promise.all(
    routes.map(route => {
      return renderCSRPage(config.head, route, htmlTemplate, emitAsset);
    }),
  );
}
