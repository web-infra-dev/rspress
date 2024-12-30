import path from 'node:path';
import { visit } from 'unist-util-visit';
import type { Plugin } from 'unified';
import { logger } from '@rspress/shared/logger';
import { cleanUrl, isExternalUrl, isProduction } from '@rspress/shared';
import type { RouteService } from '@/node/route/RouteService';
import { normalizePath } from '@/node/utils';

export interface DeadLinkCheckOptions {
  root: string;
  base: string;
  routeService: RouteService;
}

export function checkLinks(
  links: string[],
  filepath: string,
  root: string,
  routeService: RouteService,
) {
  const errorInfos: string[] = [];
  links
    .filter(link => !isExternalUrl(link, routeService.externalLinkPrefixes))
    .map(link => normalizePath(link))
    .forEach(link => {
      const relativePath = path.relative(root, filepath);

      if (!routeService.isExistRoute(cleanUrl(link))) {
        errorInfos.push(
          `Internal link to ${link} is dead, check it in ${relativePath}`,
        );
      }
    });
  // output error info
  if (errorInfos.length > 0) {
    errorInfos?.forEach(err => {
      logger.error(err);
    });
    if (isProduction()) {
      throw new Error('Dead link found');
    }
  }
}

/**
 * Remark plugin to check dead links
 */
export const remarkCheckDeadLinks: Plugin<
  DeadLinkCheckOptions[]
> = checkLink => {
  const { root, routeService } = checkLink;

  return (tree, vfile) => {
    const internalLinks = new Set<string>();

    visit(tree, 'link', (node: { url: string }) => {
      const { url } = node;
      if (!url) {
        return;
      }
      if (internalLinks.has(url)) {
        return;
      }

      if (!isExternalUrl(url, routeService.externalLinkPrefixes)) {
        const { routePath: normalizeUrl } = routeService.normalizeRoutePath(
          // fix: windows path
          url.split(path.sep).join('/')?.split('#')[0],
        );
        internalLinks.add(normalizeUrl);
      }
    });

    checkLinks(Array.from(internalLinks), vfile.path, root, routeService);
  };
};
