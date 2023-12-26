import path from 'path';
import grayMatter from 'gray-matter';
import { logger } from '../logger';

export function loadFrontMatter(
  source: string,
  filepath: string,
  root: string,
  outputWarning = false,
): {
  frontmatter: Record<string, string>;
  content: string;
} {
  let frontmatter: Record<string, string> = {};
  let content = '';

  try {
    ({ data: frontmatter, content } = grayMatter(source));
  } catch (e: any) {
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
