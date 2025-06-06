import path from 'node:path';
import { cleanUrl, isProduction } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { RouteService } from '../../route/RouteService';
import { normalizePath } from '../../utils';

// TODO: this should be added to remark-normalize-links in ./normalizeLink.ts
export interface DeadLinkCheckOptions {
  root: string;
  base: string;
  routeService: RouteService;
}

const IGNORE_REGEXP = /^(https?|mailto|tel|#)/;

export function checkLinks(
  links: string[],
  filepath: string,
  root: string,
  routeService: RouteService,
) {
  const errorInfos: string[] = [];
  links
    .filter(link => !IGNORE_REGEXP.test(link))
    .map(link => normalizePath(link))
    .forEach(link => {
      const relativePath = path.relative(root, filepath);
      if (!routeService.isExistRoute(cleanUrl(link))) {
        errorInfos.push(
          `Internal link to "${link}" is dead, check it in "${relativePath}"`,
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
  DeadLinkCheckOptions[],
  Root
> = checkLink => {
  const { root, routeService } = checkLink;

  return (tree, vfile) => {
    const internalLinks = new Set<string>();

    visit(tree, 'link', ({ url }) => {
      if (!url) {
        return;
      }
      if (internalLinks.has(url)) {
        return;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) {
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
