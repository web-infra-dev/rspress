import path from 'path';
import fs from '@rspress/shared/fs-extra';
import {
  NavItem,
  Sidebar,
  SidebarGroup,
  SidebarItem,
  SidebarDivider,
  slash,
  withBase,
} from '@rspress/shared';
import { NavMeta, SideMeta } from './type';
import { detectFilePath, extractH1Title } from './utils';

export async function scanSideMeta(
  workDir: string,
  rootDir: string,
  routePrefix: string,
) {
  const addRoutePrefix = (link: string) => `${routePrefix}${link}`;
  // find the `_meta.json` file
  const metaFile = path.resolve(workDir, '_meta.json');
  // Fix the windows path
  const relativePath = slash(path.relative(rootDir, workDir));
  let sideMeta: SideMeta | undefined;
  // Get the sidebar config from the `_meta.json` file
  try {
    // Don't use require to avoid require cache, which make hmr not work.
    sideMeta = (await fs.readJSON(metaFile, 'utf8')) as SideMeta;
  } catch (e) {
    // If the `_meta.json` file doesn't exist, we will generate the sidebar config from the directory structure.
    const subItems = await fs.readdir(workDir);
    sideMeta = (
      await Promise.all(
        subItems.map(async item => {
          // Fix https://github.com/web-infra-dev/rspress/issues/346
          if (item === '_meta.json') {
            return null;
          }
          const stat = await fs.stat(path.join(workDir, item));
          // If the item is a directory, we will transform it to a object with `type` and `name` property.
          if (stat.isDirectory()) {
            return {
              type: 'dir',
              name: item,
              label: item,
            };
          } else {
            return item;
          }
        }),
      )
    ).filter(Boolean) as SideMeta;
  }

  const sidebarFromMeta: (SidebarGroup | SidebarItem | SidebarDivider)[] =
    await Promise.all(
      sideMeta.map(async metaItem => {
        if (typeof metaItem === 'string') {
          const title = await extractH1Title(
            path.resolve(workDir, metaItem),
            rootDir,
          );
          return {
            text: title,
            link: addRoutePrefix(
              `${relativePath}/${metaItem.replace(/\.mdx?$/, '')}`,
            ),
          };
        }

        const {
          type = 'file',
          name,
          label = '',
          collapsible,
          collapsed,
          link,
          tag,
          dashed,
        } = metaItem;
        if (type === 'file') {
          const title =
            label ??
            (await extractH1Title(path.resolve(workDir, name), rootDir));
          return {
            text: title,
            link: addRoutePrefix(
              `${relativePath}/${name.replace(/\.mdx?$/, '')}`,
            ),
            tag,
          };
        } else if (type === 'dir') {
          const subDir = path.resolve(workDir, name);
          const subSidebar = await scanSideMeta(subDir, rootDir, routePrefix);
          let realPath = '';
          try {
            realPath = await detectFilePath(subDir);
          } catch (e) {
            // ignore
          }
          return {
            text: label,
            collapsible,
            collapsed,
            items: subSidebar,
            link: realPath
              ? addRoutePrefix(`${relativePath}/${name}`)
              : undefined,
            tag,
          };
        } else if (type === 'divider') {
          return { dividerType: dashed ? 'dashed' : 'solid' };
        } else {
          return {
            text: label,
            link,
            tag,
          } as SidebarItem;
        }
      }),
    );

  return sidebarFromMeta;
}

// Start walking from the doc directory, scan the `_meta.json` file in each subdirectory
// and generate the nav and sidebar config
export async function walk(workDir: string, routePrefix = '/') {
  // find the `_meta.json` file
  const rootMetaFile = path.resolve(workDir, '_meta.json');
  let navConfig: NavMeta | undefined;
  // Get the nav config from the `_meta.json` file
  try {
    navConfig = (await fs.readJSON(rootMetaFile, 'utf8')) as NavItem[];
  } catch (e) {
    navConfig = [];
  }

  navConfig.forEach(navItem => {
    if ('items' in navItem) {
      navItem.items.forEach(item => {
        if ('link' in item) {
          item.link = withBase(item.link, routePrefix);
        }
      });
    }
    if ('link' in navItem) {
      navItem.link = withBase(navItem.link, routePrefix);
    }
  });
  // find the `_meta.json` file in the subdirectory
  const subDirs = (await fs.readdir(workDir)).filter(
    v =>
      fs.statSync(path.join(workDir, v)).isDirectory() && v !== 'node_modules',
  );
  // Every sub dir will represent a group of sidebar
  const sidebarConfig: Sidebar = {};
  for (const subDir of subDirs) {
    const sidebarGroupKey = `${routePrefix}${subDir}`;
    sidebarConfig[sidebarGroupKey] = await scanSideMeta(
      path.join(workDir, subDir),
      workDir,
      routePrefix,
    );
  }
  return {
    nav: navConfig as NavItem[],
    sidebar: sidebarConfig,
  };
}
