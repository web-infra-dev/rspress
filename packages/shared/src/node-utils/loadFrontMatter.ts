import path from 'node:path';
import grayMatter from 'gray-matter';
import { logger } from '../logger';

export function loadFrontMatter<
  TFrontmatter extends Record<string, unknown> = Record<string, string>,
>(
  source: string,
  filepath: string,
  root: string,
  outputWarning = false,
): {
  frontmatter: TFrontmatter;
  content: string;
} {
  try {
    const { content, data } = grayMatter(source);
    return { content, frontmatter: data as TFrontmatter };
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

  return { content: '', frontmatter: {} as TFrontmatter };
}
