import { pathToFileURL } from 'node:url';
import type { Route, RouteMeta, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { createHead, transformHtmlTemplate } from '@unhead/react/server';
import picocolors from 'picocolors';
import type { SSRRender } from '../../runtime/ssrRender';

import { hintSSGFailed } from '../logger/hint';
import { renderHtmlTemplate } from './renderHtmlTemplate';

interface SSRBundleExports {
  render: SSRRender;
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
    const imported = await import(pathToFileURL(ssrBundlePath).toString());
    let ssrExports = imported.default;

    if (ssrExports instanceof Promise) {
      ssrExports = await ssrExports;
    }

    render = imported.render ?? ssrExports?.render;
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
  let appHtml = '';
  if (render) {
    try {
      ({ appHtml } = await render(routePath, head, configHead, {
        htmlTemplate,
        route,
      }));
    } catch (e) {
      if (e instanceof Error) {
        logger.error(
          `Page "${picocolors.yellow(routePath)}" SSG rendering failed.
${absolutePath ? picocolors.gray(`    File: ${absolutePath}\n`) : ''}    ${picocolors.gray(e.toString())}`,
        );
        throw e;
      }
    }
  }

  if (/^\s*(<!doctype html>\s*)?<html[\s>]/i.test(appHtml)) {
    return appHtml;
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
