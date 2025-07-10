import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { logger } from '@rspress/shared/logger';
import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const ERROR_PREFIX = '[remarkFileCodeBlock]';

function parseFileFromMeta(meta: string | undefined): string {
  if (!meta) {
    return '';
  }
  const kvList = meta.split(' ').filter(Boolean) as string[];
  for (const item of kvList) {
    const [k, v] = item.split('=');
    if (k === 'file' && v.length > 0) {
      return v.replace(/["'`]/g, '');
    }
  }
  return '';
}

export const remarkFileCodeBlock: Plugin<[{ filepath: string }], Root> = ({
  filepath,
}) => {
  return async tree => {
    visit(tree, 'code', node => {
      const { meta, value } = node;
      const file = parseFileFromMeta(meta ?? '');

      if (!file) {
        return;
      }

      if (file.startsWith('./') || file.startsWith('../')) {
        const resolvedFilePath = path.join(path.dirname(filepath), file);
        // we allow blank lines or spaces, which may be necessary due to formatting tools and other reasons.
        if (value.trim() !== '') {
          logger.error(`${ERROR_PREFIX} The content of file code block should be empty.

\`\`\`tsx file="./filename"
content
\`\`\`

this usage is not allowed, please use below:

\`\`\`tsx file="./filename"
\`\`\`
`);
          throw new Error(
            `${ERROR_PREFIX} The content of file code block should be empty.`,
          );
        }

        const isExist = existsSync(resolvedFilePath);

        if (!isExist) {
          throw new Error(
            `${ERROR_PREFIX} The file does not exist.
\`file="${file}"\` is resolved to ${resolvedFilePath}"`,
          );
        }

        // TODO: not support async api for perf
        const newContent = readFileSync(resolvedFilePath, 'utf-8');
        node.value = newContent;
        return;
      }

      // TODO: support resolve.alias with rspack-resolver
      throw new Error(
        `${ERROR_PREFIX} The file path should use relative path "./" or "../"`,
      );
    });
  };
};
