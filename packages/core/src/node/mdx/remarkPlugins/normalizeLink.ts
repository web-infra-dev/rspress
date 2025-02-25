import path from 'node:path';
import { isExternalUrl, normalizeHref, parseUrl, slash } from '@rspress/shared';
import { getNodeAttribute } from '@rspress/shared/node-utils';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { getASTNodeImport } from '../../utils';

interface LinkNode {
  type: string;
  url?: string;
}

/**
 * Remark plugin to normalize a link href
 */
export const remarkPluginNormalizeLink: Plugin<
  [{ base: string; root: string; cleanUrls: boolean }],
  Root
> =
  ({ base, root, cleanUrls }) =>
  (tree, file) => {
    const images: MdxjsEsm[] = [];
    visit(tree, 'link', node => {
      if (!node.url) {
        return;
      }
      if (node.url.startsWith('#')) {
        node.url = `#${node.url.slice(1)}`;
        return;
      }

      // eslint-disable-next-line prefer-const
      let { url, hash } = parseUrl(node.url);

      if (isExternalUrl(url)) {
        node.url = url + (hash ? `#${hash}` : '');
        return;
      }

      const extname = path.extname(url);

      if (extname === '.md' || extname === '.mdx') {
        url = url.replace(extname, '');
      }

      const relativePath = path.relative(root, file.path);
      if (url.startsWith('.')) {
        url = path.posix.join(slash(path.dirname(relativePath)), url);
      }

      url = normalizeHref(url, cleanUrls);

      if (hash) {
        url += `#${hash}`;
      }
      node.url = path.posix.join(base, url);
    });

    const normalizeImageUrl = (imageUrl: string): string => {
      if (isExternalUrl(imageUrl) || imageUrl.startsWith('/')) {
        return '';
      }

      return imageUrl;
    };

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

      const src = getNodeAttribute(node, 'src');

      if (typeof src !== 'string') {
        return;
      }

      const imagePath = normalizeImageUrl(src);

      if (!imagePath) {
        return;
      }

      const tempVariableName = `image${images.length}`;

      Object.assign(src, getMdxSrcAttribute(tempVariableName));

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    tree.children.unshift(...images);
  };
