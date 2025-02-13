import fs from 'node:fs/promises';
import path, { join } from 'node:path';
import {
  type NavItem,
  type Sidebar,
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  isExternalUrl,
  slash,
  withBase,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import type { NavMeta, SideMeta } from './type';
import {
  detectFilePath,
  extractInfoFromFrontmatter,
  extractInfoFromFrontmatterWithRealPath,
  pathExists,
  readJson,
} from './utils';

function getHmrFileKey(realPath: string | undefined, docsDir: string) {
  return realPath
    ? path.relative(docsDir, realPath).replace(path.extname(realPath), '')
    : '';
}

const DEFAULT_DIRNAME_PREFIX = 'rspress-dir-default-';
async function scanSideMeta(
  workDir: string,
  rootDir: string,
  docsDir: string,
  routePrefix: string,
  extensions: string[],
): Promise<
  (SidebarGroup | SidebarItem | SidebarDivider | SidebarSectionHeader)[]
> {
  if (!(await pathExists(workDir))) {
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
    sideMeta = (await readJson(metaFile)) as SideMeta;
  } catch (e) {
    // If the `_meta.json` file doesn't exist, we will generate the sidebar config from the directory structure.
    let subItems = await fs.readdir(workDir);
    // If there exists a file with the same name of the directory folder
    // we don't need to generate SideMeta for this single file
    subItems = subItems.filter(item => {
      const hasExtension = extensions.some(ext => item.endsWith(ext));
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
            return {
              type: 'dir',
              name: item,
              label: `${DEFAULT_DIRNAME_PREFIX}${item}`, // if no _meta.json, use the dir name as default
            };
          }
          return extensions.some(ext => item.endsWith(ext)) ? item : null;
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
        const { title, overviewHeaders, context, realPath } =
          await extractInfoFromFrontmatter(
            path.resolve(workDir, metaItem),
            rootDir,
            extensions,
          );
        const pureLink = `${relativePath}/${metaItem.replace(/\.mdx?$/, '')}`;
        return {
          text: title,
          link: addRoutePrefix(pureLink),
          // FIXME: overviewHeaders is number[]
          overviewHeaders,
          context,
          _fileKey: getHmrFileKey(realPath, docsDir),
        } as SidebarItem;
      }

      const {
        type = 'file',
        name,
        label,
        collapsible,
        collapsed,
        link,
        tag,
        dashed,
        overviewHeaders,
        context,
      } = metaItem;
      // when type is divider, name maybe undefined, and link is not used
      const pureLink = `${relativePath}/${name?.replace(/\.mdx?$/, '')}`;
      if (type === 'file') {
        const info = await extractInfoFromFrontmatter(
          path.resolve(workDir, name),
          rootDir,
          extensions,
        );
        const title = label || info.title;
        const realPath = info.realPath;
        return {
          text: title,
          link: addRoutePrefix(pureLink),
          tag,
          // FIXME: overviewHeaders is number[]
          overviewHeaders: info.overviewHeaders
            ? info.overviewHeaders
            : overviewHeaders,
          context: info.context ? info.context : context,
          _fileKey: getHmrFileKey(realPath, docsDir),
        } as SidebarItem;
      }

      if (type === 'dir') {
        const subDir = path.resolve(workDir, name);
        const subSidebar = await scanSideMeta(
          subDir,
          rootDir,
          docsDir,
          routePrefix,
          extensions,
        );

        // Category index convention, display a document when clicking on the sidebar directory
        // https://docusaurus.io/docs/sidebar/autogenerated#category-index-convention

        // 1. sameName /api, /api.md or /api.mdx, (this should be removed in Rspress 2.0)
        let realPath = await detectFilePath(subDir, extensions);
        let link: string;
        let _fileKey: string;

        if (realPath) {
          link = addRoutePrefix(pureLink);
          _fileKey = getHmrFileKey(realPath, docsDir);
        } else {
          // 2. index /api, /api/index.md, /api/index.mdx
          const indexFileRealPath = await detectFilePath(
            join(subDir, 'index'),
            extensions,
          );
          link = indexFileRealPath ? addRoutePrefix(pureLink) : '';
          _fileKey = getHmrFileKey(indexFileRealPath, docsDir);
          realPath = indexFileRealPath;

          // 3. if "index.mdx" or "index.md" or "index" is in _meta.json, index page should be placed to child sidebar
          const indexItemIndex = subSidebar.findIndex(i => {
            return (
              (i as { _fileKey: string | undefined })._fileKey === _fileKey
            );
          });
          const isIndexFileInMetaItems = indexItemIndex !== -1;

          if (isIndexFileInMetaItems) {
            const isMetaJsonExist = await pathExists(
              join(subDir, '_meta.json'),
            );
            if (isMetaJsonExist) {
              link = '';
              _fileKey = getHmrFileKey(indexFileRealPath, docsDir);
              realPath = undefined;
            } else {
              // 4. if _meta.json not exist, index page should be placed to dir sidebar
              subSidebar.splice(indexItemIndex, 1);
            }
          }
        }

        const { context: frontmatterContext = context, title } = realPath
          ? await extractInfoFromFrontmatterWithRealPath(realPath, rootDir)
          : ({} as { context: undefined; title: undefined });

        function getDirLabelName(): string {
          let dirName;

          if (
            typeof label === 'string' &&
            label.startsWith(DEFAULT_DIRNAME_PREFIX)
          ) {
            dirName = label.replace(DEFAULT_DIRNAME_PREFIX, '');
          }

          // 1. { "label": "DIR", type: "dir" } in _meta.json
          if (!dirName && label) {
            return label;
          }
          // 2. H1 or frontmatter title in md
          if (title) {
            return title;
          }
          // 3. fallback to fs dirname
          return dirName ?? '';
        }

        return {
          text: getDirLabelName(),
          collapsible,
          collapsed,
          items: subSidebar,
          link,
          tag,
          // FIXME: overviewHeaders is number[]
          overviewHeaders,
          context: frontmatterContext,
          _fileKey,
        } as SidebarGroup;
      }

      if (type === 'divider') {
        return {
          dividerType: dashed ? 'dashed' : 'solid',
        } satisfies SidebarDivider;
      }

      if (type === 'section-header') {
        return {
          sectionHeaderText: label ?? '',
          tag,
        } satisfies SidebarSectionHeader;
      }

      return {
        text: label ?? '',
        link:
          typeof link === 'undefined'
            ? ''
            : isExternalUrl(link)
              ? link
              : withBase(link, routePrefix),
        tag,
        context,
      } satisfies SidebarItem;
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
  extensions: string[],
) {
  // find the `_meta.json` file
  const rootMetaFile = path.resolve(workDir, '_meta.json');
  let navConfig: NavMeta | undefined;
  // Get the nav config from the `_meta.json` file
  try {
    navConfig = (await readJson(rootMetaFile)) as NavItem[];
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
  for (const subDir of subDirs) {
    const sidebarGroupKey = `${routePrefix}${subDir}`;
    sidebarConfig[sidebarGroupKey] = await scanSideMeta(
      path.join(workDir, subDir),
      workDir,
      docsDir,
      routePrefix,
      extensions,
    );
  }
  return {
    nav: navConfig as NavItem[],
    sidebar: sidebarConfig,
  };
}
