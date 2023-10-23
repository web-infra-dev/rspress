import path from 'path';
import grayMatter from 'gray-matter';
import { logger } from '@rspress/shared/logger';

export function loadFrontMatter(
  source: string,
  filepath: string,
  root: string,
  outputWarning = false,
) {
  let frontmatter: Record<string, string> = {};
  let content = '';

  try {
    ({ data: frontmatter, content } = grayMatter(source));
  } catch (e) {
    if (outputWarning) {
      logger.warn(
        `Parse frontmatter error: ${e.message} in ${path.relative(
          root,
          filepath,
        )}`,
      );
    }
  }

  return { frontmatter, content };
}
