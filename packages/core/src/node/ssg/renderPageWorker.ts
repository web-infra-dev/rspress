import { workerData } from 'node:worker_threads';
import type { RouteMeta, UserConfig } from '@rspress/shared';
import pMap from 'p-map';
import { createError } from '../utils';
import { renderPage } from './renderPage';

interface Args {
  routes: RouteMeta[];
  htmlTemplate: string;
  head: UserConfig['head'];
  ssrBundlePath: string;
}

const params = workerData?.[1]?.params as Omit<Args, 'route'>;
if (!params) {
  throw createError('SSG Worker Thread workerData params missing');
}

const { htmlTemplate, head, ssrBundlePath } = params;

const exportWorkerGlueFn = async ({ routes }: Args): Promise<string[]> => {
  return pMap(
    routes,
    async route => {
      const html = await renderPage(route, htmlTemplate, head, ssrBundlePath);
      return html;
    },
    { concurrency: 10 },
  );
};

export default exportWorkerGlueFn;
