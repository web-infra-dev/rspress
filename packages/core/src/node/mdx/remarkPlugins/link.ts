import path from 'node:path';
import {
  addLeadingSlash,
  isExternalUrl,
  isProduction,
  type MarkdownOptions,
  normalizeHref,
  parseUrl,
  withBase,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import picocolors from 'picocolors';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { hintRelativeMarkdownLink } from '../../logger/hint';
import type { RouteService } from '../../route/RouteService';
import { createError } from '../../utils';

// TODO: checkDeadLinks support external links and anchor hash links
function checkDeadLinks(
  checkDeadLinks: boolean | { excludes: string[] | ((url: string) => boolean) },
  internalLinks: Map<string, string>,
  file: VFile,
  lint?: boolean,
) {
  const errorInfos: [string, string][] = [];
  const excludes =
    typeof checkDeadLinks === 'object' ? checkDeadLinks.excludes : undefined;
  const excludesUrl = Array.isArray(excludes) ? new Set(excludes) : undefined;
  const excludesFn = typeof excludes === 'function' ? excludes : undefined;

  let possibleBreakingChange = false;

  [...internalLinks.entries()].forEach(([nodeUrl, link]) => {
    if (excludesUrl?.has(nodeUrl)) {
      return;
    }

    if (excludesFn?.(nodeUrl)) {
      return;
    }

    if (!nodeUrl.startsWith('/') && /^\w/.test(nodeUrl)) {
      possibleBreakingChange = true;
    }

    errorInfos.push([nodeUrl, link]);
  });
  // output error info
  if (errorInfos.length > 0) {
    if (possibleBreakingChange) {
      hintRelativeMarkdownLink();
    }

    const message = `Dead links found${lint ? '' : ` in ${picocolors.cyan(file.path)}`}:
${errorInfos.map(([nodeUrl, link]) => `  ${picocolors.green(`"[..](${nodeUrl})"`)} ${picocolors.gray(link)}`).join('\n')}`;

    if (lint) {
      file.message(message);
    } else {
      logger.error(message);

      if (isProduction()) {
        throw createError('Dead link found');
      }
    }
  }
}

/**
 * normalize
 * 1. `[](/api/getting-started)`
 * 2. `[](/en/api/getting-started)`
 * 3. `[](/v3/en/api/getting-started.md)`
 * to `/v3/en/api/getting-started`
 */
function looseMarkdownLink(
  url: string,
  routeService: RouteService,
  filePath: string,
): string {
  if (!routeService.isInDocsDir(filePath)) {
    return url;
  }
  const [versionPart, langPart, pureRoute] =
    routeService.splitRoutePathParts(url);
  const relativePath = routeService.absolutePathToRelativePath(filePath);
  const [versionPartCurrFile, langPartCurrFile] =
    routeService.getRoutePathParts(relativePath);

  if (versionPart === '') {
    if (langPart === '') {
      return addLeadingSlash(
        `${[versionPartCurrFile, langPartCurrFile].filter(Boolean).join('/')}${addLeadingSlash(pureRoute.replace(/^\/*/, ''))}`,
      );
    }
    return addLeadingSlash(
      `${[versionPartCurrFile, langPart].filter(Boolean).join('/')}${addLeadingSlash(pureRoute.replace(/^\/*/, ''))}`,
    );
  }

  return url;
}

/**
 *
 * @returns url without base e.g: '/en/guide/getting-started#section-1'
 */
function normalizeLink(
  nodeUrl: string,
  routeService: RouteService | null,
  filePath: string,
  cleanUrls: boolean | string,
  autoPrefix: boolean,
  deadLinks: Map<string, string>,
  __base?: string, // just for plugin-llms, we should normalize the link with base
): string {
  if (!nodeUrl) {
    return '';
  }
  if (nodeUrl.startsWith('#')) {
    return nodeUrl;
  }
  if (isExternalUrl(nodeUrl)) {
    return nodeUrl;
  }
  if (!routeService) {
    return nodeUrl;
  }

  let { url, hash, search } = parseUrl(nodeUrl);

  // 1. [](/api/getting-started) or [](/en/api/getting-started)
  if (url.startsWith('/')) {
    // TODO: add a option for disable loose mode
    // loose mode: add version and lang prefix to the link
    if (autoPrefix) {
      url = looseMarkdownLink(url, routeService, filePath);
    }

    const { routePath } = routeService.normalizeRoutePath(url);
    url = routePath;
  } else {
    // 2. [](getting-started) or [](./getting-started.md) or [](../getting-started.md)
    const anotherFileAbsolutePath = path.join(path.dirname(filePath), url);
    url = routeService.absolutePathToRoutePath(anotherFileAbsolutePath);
  }

  if (typeof cleanUrls === 'boolean') {
    url = normalizeHref(url, cleanUrls);
    // preserve dead links
    if (!routeService.isExistRoute(url)) {
      deadLinks.set(nodeUrl, url);
      return nodeUrl;
    }
  } else {
    url = normalizeHref(url, false);
    // preserve dead links
    if (!routeService.isExistRoute(url)) {
      deadLinks.set(nodeUrl, url);
      return nodeUrl;
    }
    url = url.replace(/\.html$/, cleanUrls);
  }

  if (search) {
    url += `?${search}`;
  }
  if (hash) {
    url += `#${hash}`;
  }
  if (__base) {
    url = withBase(url, __base);
  }
  return url;
}

/**
 * Remark plugin to normalize a link href
 * 1. add version and lang prefix to the link
 * 2. checkDeadLinks
 */
export const remarkLink =
  ({
    cleanUrls,
    routeService,
    remarkLinkOptions,
    lint,
    __base,
  }: {
    cleanUrls: boolean | string;
    routeService: RouteService | null;
    remarkLinkOptions?: MarkdownOptions['link'];
    lint?: boolean;
    __base?: string;
  }) =>
  (tree: Root, file: VFile) => {
    const { checkDeadLinks: shouldCheckDeadLinks = true, autoPrefix = true } =
      remarkLinkOptions ?? {};
    const deadLinks = new Map<string, string>();
    visit(tree, 'link', node => {
      const { url: nodeUrl } = node;
      const link = normalizeLink(
        nodeUrl,
        routeService,
        file.path,
        cleanUrls,
        autoPrefix,
        deadLinks,
        __base,
      );
      node.url = link;
    });

    visit(tree, 'definition', node => {
      const { url: nodeUrl } = node;
      const link = normalizeLink(
        nodeUrl,
        routeService,
        file.path,
        cleanUrls,
        autoPrefix,
        deadLinks,
        __base,
      );
      node.url = link;
    });

    if (shouldCheckDeadLinks && routeService) {
      checkDeadLinks(shouldCheckDeadLinks, deadLinks, file, lint);
    }
  };
