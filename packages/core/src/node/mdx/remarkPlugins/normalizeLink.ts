import path from 'node:path';
import {
  addTrailingSlash,
  isExternalUrl,
  isProduction,
  normalizeHref,
  parseUrl,
  removeLeadingSlash,
  removeTrailingSlash,
  withBase,
} from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { getNodeAttribute } from '@rspress/shared/node-utils';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

import { logger } from '@rspress/shared/logger';
import type { RouteService } from '../../route/RouteService';
import { getASTNodeImport } from '../../utils';

// TODO: support relative path [subfolder](subfolder) equal to [subfolder](./subfolder)

function checkDeadLinks(
  internalLinks: Map<string, string>,
  filePath: string,
  routeService: RouteService,
) {
  const errorInfos: string[] = [];
  internalLinks.entries().forEach(([nodeUrl, link]) => {
    const cleanLinkPath = linkToRoutePath(link);
    if (!cleanLinkPath) {
      return;
    }

    // allow fuzzy matching, e.g: /guide/ and /guide is equal
    if (
      !routeService.isExistRoute(removeTrailingSlash(cleanLinkPath)) &&
      !routeService.isExistRoute(addTrailingSlash(cleanLinkPath))
    ) {
      errorInfos.push(
        `Internal link to "${nodeUrl}" which points to "${cleanLinkPath}" is dead, check it in "${filePath}"`,
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
 *
 * @returns url without base e.g: '/en/guide/getting-started#section-1'
 */
function normalizeLink(
  nodeUrl: string,
  routeService: RouteService | null,
  filePath: string,
  cleanUrls: boolean | string,
  internalLinks: Map<string, string>,
  __base?: string,
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

  const extname = path.extname(url);

  if ((routeService?.extensions ?? DEFAULT_PAGE_EXTENSIONS).includes(extname)) {
    url = url.replace(new RegExp(`\\${extname}$`), '');
  }

  if (url.startsWith('.')) {
    const anotherFileAbsolutePath = path.join(path.dirname(filePath), url);
    url = routeService.absolutePathToRoutePath(anotherFileAbsolutePath);
  } else {
    url = url.replace(/\/index\.html$/, '/');
    url = url.replace(/\/index$/, '/');
    const [pathVersion, pathLang] = routeService.getRoutePathParts(
      routeService.absolutePathToRelativePath(filePath),
    );

    const [_, __, urlPath] = routeService.getRoutePathParts(url);

    url = removeLeadingSlash(urlPath);
    url = [pathVersion, pathLang, url].filter(Boolean).join('/');
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

const normalizeImageUrl = (imageUrl: string): string => {
  if (isExternalUrl(imageUrl) || imageUrl.startsWith('/')) {
    return '';
  }

  return imageUrl;
};

/**
 * Remark plugin to normalize a link href
 */
export const remarkPluginNormalizeLink: Plugin<
  [
    {
      cleanUrls: boolean | string;
      routeService: RouteService | null;
      checkDeadLinks?: boolean;
      __base?: string;
    },
  ],
  Root
> =
  ({
    cleanUrls,
    routeService,
    checkDeadLinks: shouldCheckDeadLinks = false,
    __base,
  }) =>
  (tree, file) => {
    const internalLinks = new Map<string, string>();
    visit(tree, 'link', node => {
      const { url: nodeUrl } = node;
      const link = normalizeLink(
        nodeUrl,
        routeService,
        file.path,
        cleanUrls,
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
        internalLinks,
        __base,
      );
      node.url = link;
    });

    if (shouldCheckDeadLinks && routeService) {
      checkDeadLinks(internalLinks, file.path, routeService);
    }

    const images: MdxjsEsm[] = [];
    const getMdxSrcAttribute = (tempVar: string) => {
      return {
        type: 'mdxJsxAttribute',
        name: 'src',
        value: {
          type: 'mdxJsxAttributeValueExpression',
          value: tempVar,
          data: {
            estree: {
              type: 'Program',
              sourceType: 'module',
              body: [
                {
                  type: 'ExpressionStatement',
                  expression: {
                    type: 'Identifier',
                    name: tempVar,
                  },
                },
              ],
            },
          },
        },
      };
    };

    visit(tree, 'image', node => {
      const { alt, url } = node;
      if (!url) {
        return;
      }

      const imagePath = normalizeImageUrl(url);
      if (!imagePath) {
        return;
      }
      // relative path
      const tempVariableName = `image${images.length}`;

      Object.assign(node, {
        type: 'mdxJsxFlowElement',
        name: 'img',
        children: [],
        attributes: [
          alt && {
            type: 'mdxJsxAttribute',
            name: 'alt',
            value: alt,
          },
          getMdxSrcAttribute(tempVariableName),
        ].filter(Boolean),
      });

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    visit(tree, node => {
      if (
        (node.type !== 'mdxJsxFlowElement' &&
          node.type !== 'mdxJsxTextElement') ||
        // get all img src
        node.name !== 'img'
      ) {
        return;
      }

      const srcAttr = getNodeAttribute(node, 'src', true);

      if (typeof srcAttr?.value !== 'string') {
        return;
      }

      const imagePath = normalizeImageUrl(srcAttr.value);

      if (!imagePath) {
        return;
      }

      const tempVariableName = `image${images.length}`;

      Object.assign(srcAttr, getMdxSrcAttribute(tempVariableName));

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    tree.children.unshift(...images);
  };
