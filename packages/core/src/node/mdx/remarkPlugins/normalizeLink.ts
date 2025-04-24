import path from 'node:path';
import {
  addLeadingSlash,
  isExternalUrl,
  normalizeHref,
  parseUrl,
  slash,
} from '@rspress/shared';
import { DEFAULT_PAGE_EXTENSIONS } from '@rspress/shared/constants';
import { getNodeAttribute } from '@rspress/shared/node-utils';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

import type { RouteService } from '../../route/RouteService';
import { getASTNodeImport } from '../../utils';

function normalizeLink(
  nodeUrl: string,
  routeService: RouteService | undefined,
  relativePath: string,
  cleanUrls: boolean | string,
): string {
  if (!nodeUrl) {
    return '';
  }
  if (nodeUrl.startsWith('#')) {
    return `#${nodeUrl.slice(1)}`;
  }

  // eslint-disable-next-line prefer-const
  let { url, hash } = parseUrl(nodeUrl);

  if (isExternalUrl(url)) {
    return url + (hash ? `#${hash}` : '');
  }

  const extname = path.extname(url);

  if ((routeService?.extensions ?? DEFAULT_PAGE_EXTENSIONS).includes(extname)) {
    url = url.replace(new RegExp(`\\${extname}$`), '');
  }

  if (url.startsWith('.')) {
    url = path.posix.join(slash(path.dirname(relativePath)), url);
  } else if (routeService) {
    const [pathVersion, pathLang] = routeService.getRoutePathParts(
      slash(relativePath),
    );
    const [urlVersion, urlLang, urlPath] = routeService.getRoutePathParts(url);

    url = addLeadingSlash(urlPath);

    if (pathLang && urlLang !== pathLang) {
      url = `/${pathLang}${url}`;
    }

    if (pathVersion && urlVersion !== pathVersion) {
      url = `/${pathVersion}${url}`;
    }
  }

  if (typeof cleanUrls === 'boolean') {
    url = normalizeHref(url, cleanUrls);
  } else {
    url = normalizeHref(url, false);
    url = url.replace(/\.html$/, cleanUrls);
  }

  if (hash) {
    url += `#${hash}`;
  }
  return url;
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
      root: string;
      cleanUrls: boolean | string;
      routeService?: RouteService;
    },
  ],
  Root
> =
  ({ root, cleanUrls, routeService }) =>
  (tree, file) => {
    const images: MdxjsEsm[] = [];
    visit(tree, 'link', node => {
      const { url: nodeUrl } = node;
      const relativePath = path.relative(root, file.path);
      node.url = normalizeLink(nodeUrl, routeService, relativePath, cleanUrls);
    });

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
