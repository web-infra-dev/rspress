import path from 'node:path';
import {
  addLeadingSlash,
  addTrailingSlash,
  isExternalUrl,
  isProduction,
  type MarkdownOptions,
  normalizeHref,
  parseUrl,
  removeTrailingSlash,
  withBase,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import picocolors from 'picocolors';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { hintRelativeMarkdownLink } from '../../logger/hint';
import type { RouteService } from '../../route/RouteService';

// TODO: checkDeadLinks support external links and anchor hash links
function checkDeadLinks(
  checkDeadLinks: boolean | { excludes: string[] | ((url: string) => boolean) },
  internalLinks: Map<string, string>,
  filePath: string,
  routeService: RouteService,
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

    const cleanLinkPath = linkToRoutePath(link);
    if (!cleanLinkPath) {
      return;
    }

    if (!nodeUrl.startsWith('/') && /^\w/.test(nodeUrl)) {
      possibleBreakingChange = true;
    }

    // allow fuzzy matching, e.g: /guide/ and /guide is equal
    // This is a simple judgment, the performance will be better than "matchPath" in react-router-dom
    if (
      !routeService.isExistRoute(removeTrailingSlash(cleanLinkPath)) &&
      !routeService.isExistRoute(addTrailingSlash(cleanLinkPath))
    ) {
      errorInfos.push([nodeUrl, link]);
    }
  });
  // output error info
  if (errorInfos.length > 0) {
    if (possibleBreakingChange) {
      hintRelativeMarkdownLink();
    }

    logger.error(`Dead links found in ${picocolors.cyan(filePath)}:
${errorInfos.map(([nodeUrl, link]) => `  ${picocolors.green(`"[..](${nodeUrl})"`)} ${picocolors.gray(link)}`).join('\n')}`);

    if (isProduction()) {
      throw new Error('Dead link found');
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
        `${[versionPartCurrFile, langPartCurrFile].filter(Boolean).join('/')}${addLeadingSlash(pureRoute.replace(/\/*^/, ''))}`,
      );
    }
    return addLeadingSlash(
      `${[versionPartCurrFile, langPart].filter(Boolean).join('/')}${addLeadingSlash(pureRoute.replace(/\/*^/, ''))}`,
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
  loosePrefix: boolean,
  internalLinks: Map<string, string>,
  __base?: string, // just for plugin-llms, we should normalize the link with base
): string {
  if (!nodeUrl) {
    return '';
  }
  if (nodeUrl.startsWith('#')) {
    return nodeUrl;
  }

  // eslint-disable-next-line prefer-const
  let { url, hash } = parseUrl(nodeUrl);

  if (isExternalUrl(url)) {
    return url + (hash ? `#${hash}` : '');
  }

  if (!routeService) {
    return nodeUrl;
  }

  // 1. [](/api/getting-started) or [](/en/api/getting-started)
  if (url.startsWith('/')) {
    // TODO: add a option for disable loose mode
    // loose mode: add version and lang prefix to the link
    if (loosePrefix) {
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
  } else {
    url = normalizeHref(url, false);
    url = url.replace(/\.html$/, cleanUrls);
  }

  internalLinks.set(nodeUrl, url);

  if (hash) {
    url += `#${hash}`;
  }
  if (__base) {
    url = withBase(url, __base);
  }
  return url;
}

function linkToRoutePath(routePath: string) {
  return decodeURIComponent(routePath.split('#')[0])
    .replace(/\.html$/, '')
    .replace(/\/index$/, '/');
}

/**
 * Remark plugin to normalize a link href
 * 1. add version and lang prefix to the link
 * 2. checkDeadLinks
 */
export const remarkLink: Plugin<
  [
    {
      cleanUrls: boolean | string;
      routeService: RouteService | null;
      remarkLinkOptions?: MarkdownOptions['link'];
      __base?: string;
    },
  ],
  Root
> =
  ({ cleanUrls, routeService, remarkLinkOptions, __base }) =>
  (tree, file) => {
    const { checkDeadLinks: shouldCheckDeadLinks = true, loosePrefix = true } =
      remarkLinkOptions ?? {};
    const internalLinks = new Map<string, string>();
    visit(tree, 'link', node => {
      const { url: nodeUrl } = node;
      const link = normalizeLink(
        nodeUrl,
        routeService,
        file.path,
        cleanUrls,
        loosePrefix,
        internalLinks,
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
        loosePrefix,
        internalLinks,
        __base,
      );
      node.url = link;
    });

    if (shouldCheckDeadLinks && routeService) {
      checkDeadLinks(
        shouldCheckDeadLinks,
        internalLinks,
        file.path,
        routeService,
      );
    }
  };
