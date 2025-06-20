import fs from 'node:fs/promises';
import path from 'node:path';
import { type NavItem, type Sidebar, isExternalUrl } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { absolutePathToLink } from '../utils';
import { scanSideMeta } from './normalize';
import { readJson } from './utils';

// Start walking from the doc directory, scan the `_meta.json` file in each subdirectory
// and generate the nav and sidebar config
export async function walk(
  workDir: string,
  docsDir: string,
  extensions: string[],
) {
  // find the `_meta.json` file
  const rootMetaFile = path.resolve(workDir, '_meta.json');
  let navConfig: NavItem[] | undefined;
  // Get the nav config from the `_meta.json` file
  try {
    navConfig = await readJson<NavItem[]>(rootMetaFile);
  } catch (e) {
    logger.error(
      '[auto-nav-sidebar]',
      `Generate nav meta error: ${rootMetaFile} not exists`,
    );
    navConfig = [];
  }

  const routePrefix = absolutePathToLink(workDir, docsDir);
  const addRoutePrefix = (link: string): string =>
    `${routePrefix.replace(/\/$/, '')}/${link.replace(/^\//, '')}`;

  navConfig.forEach(navItem => {
    if ('items' in navItem) {
      navItem.items.forEach(item => {
        if ('link' in item && !isExternalUrl(item.link)) {
          item.link = addRoutePrefix(item.link);
        }
      });
    }
    if ('link' in navItem && !isExternalUrl(navItem.link)) {
      navItem.link = addRoutePrefix(navItem.link);
    }
  });
  // find the `_meta.json` file in the subdirectory
  const subDirs: string[] = (
    await Promise.all(
      (
        await fs.readdir(workDir)
      ).map(v => {
        return fs.stat(path.join(workDir, v)).then(s => {
          if (s.isDirectory() && v !== 'node_modules') {
            return v;
          }
          return false;
        });
      }),
    )
  ).filter(Boolean) as string[];
  // Every sub dir will represent a group of sidebar
  const sidebarConfig: Sidebar = {};

  await Promise.all(
    subDirs.map(async subDir => {
      const sidebarGroupKey = addRoutePrefix(subDir);
      sidebarConfig[sidebarGroupKey] = await scanSideMeta(
        path.join(workDir, subDir),
        docsDir,
        extensions,
      );
    }),
  );
  return {
    nav: navConfig as NavItem[],
    sidebar: sidebarConfig,
  };
}
