import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Rspack } from '@rsbuild/core';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import picocolors from 'picocolors';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const ERROR_PREFIX = '[remarkFileCodeBlock]';

function parseFileFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  const kvList = meta.split(' ').filter(Boolean);
  for (const item of kvList) {
    const [k, v = ''] = item.split('=');
    if (k === 'file' && v.length > 0) {
      return v.replace(/["'`]/g, '');
    }
  }
  return '';
}

export const remarkFileCodeBlock: Plugin<
  [{ filepath: string; addDependency?: Rspack.LoaderContext['addDependency'] }],
  Root
> = ({ filepath, addDependency }) => {
  return async tree => {
    const promiseList: Promise<void>[] = [];
    visit(tree, 'code', node => {
      const { meta, value, lang } = node;
      const file = parseFileFromMeta(meta ?? '');

      if (!file) {
        return;
      }

      const originalMetaForErrorInfo = picocolors.cyan(`\`\`\`${lang} ${meta}`);

      if (file.startsWith('./') || file.startsWith('../')) {
        const resolvedFilePath = path.join(path.dirname(filepath), file);
        // we allow blank lines or spaces, which may be necessary due to formatting tools and other reasons.
        if (value.trim() !== '') {
          logger.error(`${ERROR_PREFIX} ${originalMetaForErrorInfo} The content of file code block should be empty.

\`\`\`tsx file="./filename"
content
\`\`\`

this usage is not allowed, please use below:

\`\`\`tsx file="./filename"
\`\`\`
`);
          throw new Error(
            `${ERROR_PREFIX} ${originalMetaForErrorInfo} The content of file code block should be empty.`,
          );
        }

        const promise = readFile(resolvedFilePath, 'utf-8')
          .then(fileContent => {
            // hmr in dev
            addDependency?.(resolvedFilePath);
            node.value = fileContent;
          })
          .catch(e => {
            const message = `${ERROR_PREFIX} ${originalMetaForErrorInfo} introduces another file in "${resolvedFilePath}", but the file does not exist.`;
            logger.error(message);
            e.message = `${message}\n${e.message}`;
            throw e;
          });

        promiseList.push(promise);
        return;
      }

      // TODO: support resolve.alias and npm package with rspack-resolver
      logger.error(`${ERROR_PREFIX} ${originalMetaForErrorInfo} syntax error of file code block:
Please use below:

\`\`\`tsx file="./filename"
\`\`\`
`);
      throw new Error(
        `${ERROR_PREFIX} ${originalMetaForErrorInfo} syntax error of file code block`,
      );
    });

    await Promise.all(promiseList);
  };
};
