import path from 'path';
import fs from '@rspress/shared/fs-extra';
import { NavItem, Sidebar } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { loadFrontMatter } from '@rspress/shared/node-utils';

export async function detectFilePath(rawPath: string) {
  const extensions = ['.mdx', '.md', '.tsx', '.jsx', '.ts', '.js'];
  // The params doesn't have extension name, so we need to try to find the file with the extension name.
  let realPath: string | undefined = rawPath;
  const filename = path.basename(rawPath);
  if (filename.indexOf('.') === -1) {
    const pathWithExtension = extensions.map(ext => `${rawPath}${ext}`);
    const pathExistInfo = await Promise.all(
      pathWithExtension.map(p => fs.pathExists(p)),
    );
    realPath = pathWithExtension.find((_, i) => pathExistInfo[i]);
  }

  if (!realPath) {
    // Throw an error and it will be caught by the `extractH1Title`.
    throw new Error();
  }

  return realPath;
}

export async function extractH1Title(
  filePath: string,
  rootDir: string,
): Promise<string> {
  try {
    const realPath = await detectFilePath(filePath);
    const content = await fs.readFile(realPath, 'utf-8');
    const fileNameWithoutExt = path.basename(realPath, path.extname(realPath));
    const h1RegExp = /^#\s+(.*)$/m;
    const match = content.match(h1RegExp);
    if (!match) {
      const { frontmatter } = loadFrontMatter(content, filePath, rootDir);
      return frontmatter.title || fileNameWithoutExt;
    } else {
      return match[1] || fileNameWithoutExt;
    }
  } catch (e) {
    logger.warn(
      `Can't find the file: ${filePath}, please check it in "${path.join(
        path.dirname(filePath),
        '_meta.json',
      )}".`,
    );
    return '';
  }
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
