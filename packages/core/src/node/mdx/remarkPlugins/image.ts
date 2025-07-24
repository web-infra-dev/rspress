import { isExternalUrl } from '@rspress/shared';
import { getNodeAttribute } from '@rspress/shared/node-utils';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { getASTNodeImport } from '../../utils';

const normalizeImageUrl = (imageUrl: string): string => {
  if (isExternalUrl(imageUrl) || imageUrl.startsWith('/')) {
    return '';
  }

  return imageUrl;
};

export const remarkImage: Plugin<[], Root> = () => (tree, _file) => {
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
