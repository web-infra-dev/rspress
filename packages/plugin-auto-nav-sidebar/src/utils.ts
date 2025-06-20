import fs from 'node:fs/promises';
import path from 'node:path';
import type { NavItem, Sidebar } from '@rspress/shared';
import { extractTextAndId, loadFrontMatter } from '@rspress/shared/node-utils';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T = unknown>(path: string): Promise<T> {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

export async function extractInfoFromFrontmatterWithAbsolutePath(
  absolutePath: string,
  rootDir: string,
): Promise<{
  title: string;
  overviewHeaders: number[] | undefined;
  context: string | undefined;
}> {
  const content = await fs.readFile(absolutePath, 'utf-8');
  const fileNameWithoutExt = path.basename(
    absolutePath,
    path.extname(absolutePath),
  );
  const h1RegExp = /^#\s+(.*)$/m;
  const match = content.match(h1RegExp);
  const { frontmatter } = loadFrontMatter(content, absolutePath, rootDir);
  return {
    title: extractTextAndId(
      frontmatter.title || match?.[1] || fileNameWithoutExt,
    )[0],
    overviewHeaders: frontmatter.overviewHeaders,
    context: frontmatter.context,
  };
}

export function combineWalkResult(
  walks: { nav: NavItem[]; sidebar: Sidebar }[],
  versions: string[],
) {
  return walks.reduce(
    (acc, cur, curIndex) => ({
      nav: {
        ...acc.nav,
        [versions[curIndex] || 'default']: cur.nav,
      },
      sidebar: { ...acc.sidebar, ...cur.sidebar },
    }),
    {
      nav: {},
      sidebar: {},
    },
  );
}
