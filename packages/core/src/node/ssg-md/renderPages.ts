import { logger } from '@rspress/shared/logger';
import pMap from 'p-map';
import picocolors from 'picocolors';
import type { RouteService } from '../route/RouteService';
import { SSGConcurrency } from '../ssg/ssgEnv';
import { renderPage } from './renderPage';

const routePage2MdFilename = (routePath: string) => {
  let fileName = routePath;
  if (fileName.endsWith('/')) {
    fileName = `${routePath}index.md`;
  } else {
    fileName = `${routePath}.md`;
  }

  return fileName.replace(/^\/+/, '');
};

export async function renderPages(
  routeService: RouteService,
  ssrBundlePath: string,
  emitAsset: (assetName: string, content: string | Buffer) => void,
): Promise<Map<string, string>> {
  logger.info('Rendering md pages...');
  const startTime = Date.now();
  const result = new Map<string, string>();

  const routes = routeService.getRoutes();
  await pMap(
    routes,
    async route => {
      const html = await renderPage(route, ssrBundlePath);
      const fileName = routePage2MdFilename(route.routePath);
      emitAsset(fileName, html);
      result.set(route.routePath, html);
    },
    {
      concurrency: SSGConcurrency(),
    },
  );
  const totalTime = Date.now() - startTime;
  logger.success(`Markdown rendered in ${picocolors.yellow(totalTime)} ms.`);
  return result;
}
