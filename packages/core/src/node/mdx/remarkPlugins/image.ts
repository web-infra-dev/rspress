import { existsSync } from 'node:fs';
import path from 'node:path';
import {
  isDataUrl,
  isExternalUrl,
  isProduction,
  type MarkdownOptions,
  parseUrl,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { getNodeAttribute } from '@rspress/shared/node-utils';
import type { Root } from 'mdast';
import type { MdxjsEsm } from 'mdast-util-mdxjs-esm';
import picocolors from 'picocolors';
import { visit } from 'unist-util-visit';
import type { VFile } from 'vfile';
import { PUBLIC_DIR } from '../../constants';
import { createError, getDefaultImportAstNode } from '../../utils';

const normalizeImageUrl = (imageUrl: string): string => {
  if (isExternalUrl(imageUrl) || imageUrl.startsWith('/')) {
    return '';
  }

  return imageUrl;
};

function checkDeadImages(
  checkDeadImages:
    | boolean
    | { excludes: string[] | ((url: string) => boolean) },
  deadImages: Map<string, string>,
  file: VFile,
  lint?: boolean,
) {
  const errorInfos: [string, string][] = [];
  const excludes =
    typeof checkDeadImages === 'object' ? checkDeadImages.excludes : undefined;
  const excludesUrl = Array.isArray(excludes) ? new Set(excludes) : undefined;
  const excludesFn = typeof excludes === 'function' ? excludes : undefined;

  [...deadImages.entries()].forEach(([imageUrl, resolvedPath]) => {
    if (excludesUrl?.has(imageUrl)) {
      return;
    }

    if (excludesFn?.(imageUrl)) {
      return;
    }

    errorInfos.push([imageUrl, resolvedPath]);
  });

  // output error info
  if (errorInfos.length > 0) {
    const message = `Dead images found${lint ? '' : ` in ${picocolors.cyan(file.path)}`}:
${errorInfos.map(([imageUrl, resolved]) => `  ${picocolors.green(`"![..](${imageUrl})"`)} ${picocolors.gray(resolved)}`).join('\n')}`;

    if (lint) {
      file.message(message);
    } else {
      logger.error(message);

      if (isProduction()) {
        throw createError('Dead image found');
      }
    }
  }
}

function resolveImage(
  imageUrl: string,
  filePath: string,
  docDirectory: string,
  deadImages: Map<string, string>,
): void {
  if (!imageUrl) {
    return;
  }
  if (isExternalUrl(imageUrl)) {
    return;
  }
  if (isDataUrl(imageUrl)) {
    return;
  }

  const { url } = parseUrl(imageUrl);

  if (url.startsWith('/')) {
    const resolvedPath = path.join(docDirectory, PUBLIC_DIR, url);
    if (!existsSync(resolvedPath)) {
      deadImages.set(imageUrl, resolvedPath);
    }
  } else {
    const resolvedPath = path.resolve(path.dirname(filePath), url);
    if (!existsSync(resolvedPath)) {
      deadImages.set(imageUrl, resolvedPath);
    }
  }
}

export const remarkImage =
  ({
    docDirectory,
    remarkImageOptions,
    lint,
  }: {
    docDirectory: string;
    remarkImageOptions?: MarkdownOptions['image'];
    lint?: boolean;
  }) =>
  (tree: Root, file: VFile) => {
    const { checkDeadImages: shouldCheckDeadImages = true } =
      remarkImageOptions ?? {};
    const deadImages = new Map<string, string>();
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
    const getMdxAltAttribute = (alt = '') => {
      return {
        type: 'mdxJsxAttribute' as const,
        name: 'alt',
        value: alt,
      };
    };

    visit(tree, 'image', node => {
      const { alt, url } = node;
      if (!url) {
        return;
      }

      if (shouldCheckDeadImages) {
        resolveImage(url, file.path, docDirectory, deadImages);
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
          getMdxAltAttribute(alt ?? ''),
          getMdxSrcAttribute(tempVariableName),
        ].filter(Boolean),
      });

      images.push(getDefaultImportAstNode(tempVariableName, imagePath));
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

      const altAttr = getNodeAttribute(node, 'alt', true);
      if (!altAttr) {
        node.attributes.push(getMdxAltAttribute());
      }

      if (shouldCheckDeadImages) {
        resolveImage(srcAttr.value, file.path, docDirectory, deadImages);
      }

      const imagePath = normalizeImageUrl(srcAttr.value);

      if (!imagePath) {
        return;
      }

      const tempVariableName = `image${images.length}`;

      Object.assign(srcAttr, getMdxSrcAttribute(tempVariableName));

      images.push(getDefaultImportAstNode(tempVariableName, imagePath));
    });

    tree.children.unshift(...images);

    if (shouldCheckDeadImages) {
      checkDeadImages(shouldCheckDeadImages, deadImages, file, lint);
    }
  };
