import path from 'node:path';
import fs from '@rspress/shared/fs-extra';
import type { NavItem, Sidebar } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';

/**
 *
 * @param rawPath e.g: /usr/rspress-demo/docs/api.md or /usr/rspress-demo/docs/api
 * @param extensions e.g: [".md"]
 * @returns
 */
export async function detectFilePath(
  rawPath: string,
  extensions: string[],
): Promise<string | undefined> {
  const pathWithExtension = extensions.map(ext => `${rawPath}${ext}`);
  const pathExistInfo = await Promise.all(
    pathWithExtension.map(p => fs.pathExists(p)),
  );
  const findPath = pathWithExtension.find((_, i) => pathExistInfo[i]);

  if (!findPath) {
    const stat = await fs.stat(rawPath);
    if (stat.isFile()) {
      return rawPath;
    }
    return undefined;
  }
  return findPath;
}

export async function extractInfoFromFrontmatter(
  filePath: string,
  rootDir: string,
  extensions: string[],
): Promise<{
  realPath: string | undefined;
  title: string;
  overviewHeaders: string | undefined;
  context: string | undefined;
}> {
  const realPath = await detectFilePath(filePath, extensions);
  if (!realPath) {
    logger.warn(
      `Can't find the file: ${filePath}, please check it in "${path.join(
        path.dirname(filePath),
        '_meta.json',
      )}".`,
    );
    return {
      realPath,
      title: '',
      overviewHeaders: undefined,
      context: undefined,
    };
  }
  return {
    ...(await extractInfoFromFrontmatterWithRealPath(realPath, rootDir)),
    realPath,
  };
}

export async function extractInfoFromFrontmatterWithRealPath(
  realPath: string,
  rootDir: string,
): Promise<{
  title: string;
  overviewHeaders: string | undefined;
  context: string | undefined;
}> {
  const content = await fs.readFile(realPath, 'utf-8');
  const fileNameWithoutExt = path.basename(realPath, path.extname(realPath));
  const h1RegExp = /^#\s+(.*)$/m;
  const match = content.match(h1RegExp);
  const { frontmatter } = loadFrontMatter(content, realPath, rootDir);
  return {
    title: frontmatter.title || match?.[1] || fileNameWithoutExt,
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
