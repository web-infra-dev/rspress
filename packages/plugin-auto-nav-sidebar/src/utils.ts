import path from 'node:path';
import fs from '@rspress/shared/fs-extra';
import type { NavItem, Sidebar } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';

export async function detectFilePath(rawPath: string, extensions: string[]) {
  // The params doesn't have extension name, so we need to try to find the file with the extension name.
  let realPath: string | undefined = rawPath;
  const fileExtname = path.extname(rawPath);

  // pathname may contain .json, see issue: https://github.com/web-infra-dev/rspress/issues/951
  if (!extensions.includes(fileExtname)) {
    const pathWithExtension = extensions.map(ext => `${rawPath}${ext}`);
    const pathExistInfo = await Promise.all(
      pathWithExtension.map(p => fs.pathExists(p)),
    );
    const findPath = pathWithExtension.find((_, i) => pathExistInfo[i]);
    // file may be public resource, see issue: https://github.com/web-infra-dev/rspress/issues/1052
    if (!fileExtname || findPath) {
      realPath = findPath;
    }
  }

  return realPath;
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
  const content = await fs.readFile(realPath, 'utf-8');
  const fileNameWithoutExt = path.basename(realPath, path.extname(realPath));
  const h1RegExp = /^#\s+(.*)$/m;
  const match = content.match(h1RegExp);
  const { frontmatter } = loadFrontMatter(content, filePath, rootDir);
  return {
    realPath,
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
