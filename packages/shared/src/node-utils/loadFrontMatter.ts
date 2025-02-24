import path from 'node:path';
import grayMatter from 'gray-matter';
import { logger } from '../logger';
import type { FrontMatterMeta } from '../types';

export function loadFrontMatter<
  TFrontmatter extends Record<string, unknown> = FrontMatterMeta,
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
  } catch (e) {
    if (outputWarning) {
      logger.warn(
        `Parse frontmatter error in ${path.relative(root, filepath)}: \n`,
        e,
      );
    }
  }

  return { content: '', frontmatter: {} as TFrontmatter };
}
