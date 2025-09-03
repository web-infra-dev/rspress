import path from 'node:path';
import type { NavItem, Sidebar } from '@rspress/shared';
import { walk } from './walk';

export function combineWalkResult(
  walks: { nav: NavItem[]; sidebar: Sidebar }[],
  versions: string[],
): { nav: Record<string, NavItem[]>; sidebar: Sidebar } {
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

export function processLocales(
  langs: string[],
  versions: string[],
  root: string,
  extensions: string[],
  metaFileSet: Set<string>,
): Promise<{ nav: Record<string, NavItem[]>; sidebar: Sidebar }[]> {
  return Promise.all(
    langs.map(async lang => {
      const walks = versions.length
        ? await Promise.all(
            versions.map(version => {
              return walk(
                path.join(root, version, lang),
                root,
                extensions,
                metaFileSet,
              );
            }),
          )
        : [await walk(path.join(root, lang), root, extensions, metaFileSet)];
      return combineWalkResult(walks, versions);
    }),
  );
}
