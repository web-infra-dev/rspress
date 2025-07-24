import fs from 'node:fs/promises';
import path from 'node:path';
import { isExternalUrl, type NavItem, type Sidebar } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { hintNavJsonChangeThenPanic } from '../logger/hint';
import { addRoutePrefix } from '../route/RoutePage';
import { pathExists } from '../utils';
import { scanSideMeta } from './normalize';
import { readJson } from './utils';

async function scanNav(workDir: string, docsDir: string) {
  let navConfig: NavItem[] | undefined;
  const rootNavJson = path.resolve(workDir, '_nav.json');
  // Get the nav config from the `_meta.json` file
  try {
    navConfig = await readJson<NavItem[]>(rootNavJson);
  } catch (_e) {
    logger.error(
      '[auto-nav-sidebar]',
      `Generate nav meta error: ${rootNavJson} failed`,
    );
    navConfig = [];
  }

  navConfig.forEach(navItem => {
    if ('items' in navItem) {
      navItem.items.forEach(item => {
        if ('link' in item && !isExternalUrl(item.link)) {
          item.link = addRoutePrefix(workDir, docsDir, item.link);
        }
      });
    }
    if ('link' in navItem && !isExternalUrl(navItem.link)) {
      navItem.link = addRoutePrefix(workDir, docsDir, navItem.link);
    }
  });
  return navConfig;
}

// Start walking from the doc directory, scan the `_meta.json` file in each subdirectory
// and generate the nav and sidebar config
export async function walk(
  workDir: string,
  docsDir: string,
  extensions: string[],
) {
  // find the `_meta.json` file
  const rootNavJson = path.resolve(workDir, '_nav.json');
  const rootMetaJson = path.resolve(workDir, '_meta.json');

  const isRootNavJsonExist = await pathExists(rootNavJson);
  const isRootMetaJsonExist = await pathExists(rootMetaJson);

  if (isRootMetaJsonExist) {
    const metaConfig = await readJson<NavItem[]>(rootMetaJson);
    hintNavJsonChangeThenPanic(metaConfig, workDir, docsDir);
  }

  if (isRootNavJsonExist) {
    const navConfig = await scanNav(workDir, docsDir);
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
        const sidebarGroupKey = addRoutePrefix(workDir, docsDir, subDir);
        sidebarConfig[sidebarGroupKey] = await scanSideMeta(
          path.join(workDir, subDir),
          docsDir,
          extensions,
        );
      }),
    );

    if (isRootMetaJsonExist) {
      const rootMetaConfig = await scanSideMeta(workDir, docsDir, extensions);
      sidebarConfig['/'] = rootMetaConfig;
    }

    return {
      nav: navConfig as NavItem[],
      sidebar: sidebarConfig,
    };
  }

  return {
    nav: [],
    sidebar: {
      '/': await scanSideMeta(workDir, docsDir, extensions),
    },
  };
}
