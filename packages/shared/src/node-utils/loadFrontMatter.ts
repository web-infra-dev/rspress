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
  content: string; // without frontmatter
  emptyLinesSource: string; // replace frontmatter with empty lines
} {
  try {
    const { content, data } = grayMatter(source);
    const rawFrontMatter = source.slice(0, source.length - content.length);
    const emptyLinesSource = rawFrontMatter.length
      ? `${rawFrontMatter.replace(/[^\n]/g, '')}${content}`
      : content;
    return { content, frontmatter: data as TFrontmatter, emptyLinesSource };
  } catch (e) {
    if (outputWarning) {
      logger.warn(
        `Parse frontmatter error in ${path.relative(root, filepath)}: \n`,
        e,
      );
    }
  }

  return {
    content: '',
    frontmatter: {} as TFrontmatter,
    emptyLinesSource: source,
  };
}
