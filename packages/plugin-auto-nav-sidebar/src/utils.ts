import fs from 'node:fs/promises';
import path from 'node:path';
import type { NavItem, Sidebar } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';

export async function pathExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJson(path: string): Promise<any> {
  const raw = await fs.readFile(path, 'utf8');
  return JSON.parse(raw);
}

/**
 * @param rawPathWithExtension /usr/rspress-demo/docs/api.md
 * @returns /usr/rspress-demo/docs/api.md or undefined
 */
export async function detectFilePathWithExtension(
  rawPathWithExtension: string,
): Promise<string | undefined> {
  const exist = await pathExists(rawPathWithExtension);
  if (!exist) {
    return undefined;
  }
  const stat = await fs.stat(rawPathWithExtension);
  if (!stat.isFile()) {
    return undefined;
  }
  return rawPathWithExtension;
}

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
  // 1.  rawPath: /usr/rspress-demo/docs/api.md
  const realPath = await detectFilePathWithExtension(rawPath);
  if (realPath) {
    const ext = path.extname(realPath);
    if (extensions.includes(ext)) {
      return realPath;
    }
  }

  // 2. rawPath: /usr/rspress-demo/docs/api
  // The params doesn't have extension name, so we need to try to find the file with the extension name.
  const pathWithExtension = extensions.map(ext => `${rawPath}${ext}`);
  const realPaths = await Promise.all(
    pathWithExtension.map(p => detectFilePathWithExtension(p)),
  );
  const findPath = pathWithExtension.find((_, i) => realPaths[i]);
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
