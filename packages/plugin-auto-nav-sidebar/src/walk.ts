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
  isExternalUrl,
  SidebarSectionHeader,
} from '@rspress/shared';
import { NavMeta, SideMeta } from './type';
import { detectFilePath, extractTitleAndOverviewHeaders } from './utils';
import { logger } from '@rspress/shared/logger';

export async function scanSideMeta(
  workDir: string,
  rootDir: string,
  docsDir: string,
  routePrefix: string,
) {
  if (!(await fs.exists(workDir))) {
    logger.error(
      '[plugin-auto-nav-sidebar]',
      `Generate sidebar meta error: ${workDir} not exists`,
    );
  }
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
    let subItems = await fs.readdir(workDir);
    // If there exists a file with the same name of the directory folder
    // we don't need to generate SideMeta for this single file
    subItems = subItems.filter(item => {
      const hasExtension = ['.md', '.mdx'].some(ext => item.endsWith(ext));
      const hasSameBaseName = subItems.some(elem => {
        const baseName = elem.replace(/\.[^/.]+$/, '');
        return baseName === item.replace(/\.[^/.]+$/, '') && elem !== item;
      });
      return !(hasExtension && hasSameBaseName);
    });
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
            // set H1 title to sidebar label when have same name md/mdx file
            const mdFilePath = path.join(workDir, `${item}.md`);
            const mdxFilePath = path.join(workDir, `${item}.mdx`);
            let label = item;

            const setLabelFromFilePath = async (filePath: string) => {
              const { title } = await extractTitleAndOverviewHeaders(
                filePath,
                rootDir,
              );
              label = title;
            };

            if (fs.existsSync(mdxFilePath)) {
              await setLabelFromFilePath(mdxFilePath);
            } else if (fs.existsSync(mdFilePath)) {
              await setLabelFromFilePath(mdFilePath);
            }

            return {
              type: 'dir',
              name: item,
              label,
            };
          }
          return item;
        }),
      )
    ).filter(Boolean) as SideMeta;
  }

  const sidebarFromMeta: (
    | SidebarGroup
    | SidebarItem
    | SidebarDivider
    | SidebarSectionHeader
  )[] = await Promise.all(
    sideMeta.map(async metaItem => {
      if (typeof metaItem === 'string') {
        const { title, overviewHeaders } = await extractTitleAndOverviewHeaders(
          path.resolve(workDir, metaItem),
          rootDir,
        );
        const pureLink = `${relativePath}/${metaItem.replace(/\.mdx?$/, '')}`;
        return {
          text: title,
          link: addRoutePrefix(pureLink),
          overviewHeaders,
          _fileKey: path.relative(docsDir, path.join(workDir, metaItem)),
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
        overviewHeaders,
      } = metaItem;
      // when type is divider, name maybe undefined, and link is not used
      const pureLink = `${relativePath}/${name?.replace(/\.mdx?$/, '')}`;
      if (type === 'file') {
        const titleAndOverviewHeaders = await extractTitleAndOverviewHeaders(
          path.resolve(workDir, name),
          rootDir,
        );
        const title = label || titleAndOverviewHeaders.title;
        const realPath = titleAndOverviewHeaders.realPath;
        return {
          text: title,
          link: addRoutePrefix(pureLink),
          tag,
          overviewHeaders: titleAndOverviewHeaders.overviewHeaders
            ? titleAndOverviewHeaders.overviewHeaders
            : overviewHeaders,
          _fileKey: realPath ? path.relative(docsDir, realPath) : '',
        };
      }

      if (type === 'dir') {
        const subDir = path.resolve(workDir, name);
        const subSidebar = await scanSideMeta(
          subDir,
          rootDir,
          docsDir,
          routePrefix,
        );
        const realPath = await detectFilePath(subDir);
        return {
          text: label,
          collapsible,
          collapsed,
          items: subSidebar,
          link: realPath ? addRoutePrefix(pureLink) : '',
          tag,
          overviewHeaders,
          _fileKey: realPath ? path.relative(docsDir, realPath) : '',
        };
      }

      if (type === 'divider') {
        return { dividerType: dashed ? 'dashed' : 'solid' };
      }

      if (type === 'section-header') {
        return { sectionHeaderText: label, tag };
      }
      return {
        text: label,
        link: isExternalUrl(link) ? link : withBase(link, routePrefix),
        tag,
      } as SidebarItem;
    }),
  );

  return sidebarFromMeta;
}

// Start walking from the doc directory, scan the `_meta.json` file in each subdirectory
// and generate the nav and sidebar config
export async function walk(
  workDir: string,
  routePrefix = '/',
  docsDir: string,
) {
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
      docsDir,
      routePrefix,
    );
  }
  return {
    nav: navConfig as NavItem[],
    sidebar: sidebarConfig,
  };
}
