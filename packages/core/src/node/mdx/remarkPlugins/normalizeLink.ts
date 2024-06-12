import path from 'node:path';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import { normalizeHref, parseUrl, isExternalUrl, slash } from '@rspress/shared';
import { getASTNodeImport } from '@/node/utils/getASTNodeImport';

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
    visit(
      tree,
      (node: LinkNode) => node.type === 'link',
      (node: LinkNode) => {
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
      },
    );

    const normalizeImageUrl = (imageUrl: string): string => {
      if (isExternalUrl(imageUrl) || imageUrl.startsWith('/')) {
        return '';
      }

      return imageUrl;
    };

    const getMdxSrcAttrbute = (tempVar: string) => {
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
      const { url } = node;
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
          node.alt && {
            type: 'mdxJsxAttribute',
            name: 'alt',
            value: node.alt,
          },
          getMdxSrcAttrbute(tempVariableName),
        ].filter(Boolean),
      });

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
      // get all img src
      if (node.name !== 'img') {
        return;
      }

      const src = node.attributes.find((attr: any) => attr.name === 'src');

      if (!src?.value || typeof src?.value !== 'string') {
        return;
      }

      const imagePath = normalizeImageUrl(src.value);

      if (!imagePath) {
        return;
      }

      const tempVariableName = `image${images.length}`;

      Object.assign(src, getMdxSrcAttrbute(tempVariableName));

      images.push(getASTNodeImport(tempVariableName, imagePath));
    });

    tree.children.unshift(...images);
  };
