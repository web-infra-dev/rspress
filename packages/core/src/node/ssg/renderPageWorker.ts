import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { workerData } from 'node:worker_threads';
import type { RouteMeta, UserConfig } from '@rspress/shared';
import pMap from 'p-map';
import { createError } from '../utils';
import type { AlternateLinksByRoute } from './alternateLinks';
import { resolveHtmlFilePath } from './htmlFile';
import { renderPage } from './renderPage';

interface WorkerDataParams {
  htmlTemplate: string;
  head: UserConfig['head'];
  ssrBundlePath: string;
  alternateLinks: AlternateLinksByRoute;
  distPath?: string;
}

interface WorkerTask {
  routes: RouteMeta[];
}

const params = workerData?.[1]?.params as WorkerDataParams;
if (!params) {
  throw createError('SSG Worker Thread workerData params missing');
}

const { htmlTemplate, head, ssrBundlePath, alternateLinks, distPath } = params;

async function writeHtmlFile(routePath: string, html: string) {
  if (!distPath) {
    return;
  }

  const fileAbsolutePath = resolveHtmlFilePath(distPath, routePath);
  await mkdir(dirname(fileAbsolutePath), { recursive: true });
  await writeFile(fileAbsolutePath, html);
}

const exportWorkerGlueFn = async ({
  routes,
}: WorkerTask): Promise<string[]> => {
  if (distPath) {
    await pMap(
      routes,
      async route => {
        const html = await renderPage(
          route,
          htmlTemplate,
          head,
          ssrBundlePath,
          alternateLinks[route.routePath],
        );
        await writeHtmlFile(route.routePath, html);
      },
      { concurrency: 10 },
    );
    return [];
  }

  return pMap(
    routes,
    async route => {
      const html = await renderPage(
        route,
        htmlTemplate,
        head,
        ssrBundlePath,
        alternateLinks[route.routePath],
      );
      return html;
    },
    { concurrency: 10 },
  );
};

export default exportWorkerGlueFn;
