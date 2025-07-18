import type { RouteMeta, UserConfig } from '@rspress/shared';
import { renderPage } from './renderPage';

const exportWorkerGlueFn = ({
  head,
  htmlTemplate,
  route,
  ssrBundlePath,
}: {
  route: RouteMeta;
  htmlTemplate: string;
  head: UserConfig['head'];
  ssrBundlePath: string;
}) => {
  return renderPage(route, htmlTemplate, head, ssrBundlePath);
};

export default exportWorkerGlueFn;
