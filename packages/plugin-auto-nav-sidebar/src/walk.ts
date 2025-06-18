import fs from 'node:fs/promises';
import path from 'node:path';
import {
  type NavItem,
  type Sidebar,
  isExternalUrl,
  withBase,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { scanSideMeta } from './normalize';
import { readJson } from './utils';

// Start walking from the doc directory, scan the `_meta.json` file in each subdirectory
// and generate the nav and sidebar config
export async function walk(
  workDir: string,
  routePrefix = '/',
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
      '[plugin-auto-nav-sidebar]',
      `Generate nav meta error: ${rootMetaFile} not exists`,
    );
    navConfig = [];
  }

  navConfig.forEach(navItem => {
    if ('items' in navItem) {
      navItem.items.forEach(item => {
        if ('link' in item && !isExternalUrl(item.link)) {
          item.link = withBase(item.link, routePrefix);
        }
      });
    }
    if ('link' in navItem && !isExternalUrl(navItem.link)) {
      navItem.link = withBase(navItem.link, routePrefix);
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
      const sidebarGroupKey = `${routePrefix}${subDir}`;
      sidebarConfig[sidebarGroupKey] = await scanSideMeta(
        path.join(workDir, subDir),
        docsDir,
        routePrefix,
        extensions,
      );
    }),
  );
  return {
    nav: navConfig as NavItem[],
    sidebar: sidebarConfig,
  };
}
