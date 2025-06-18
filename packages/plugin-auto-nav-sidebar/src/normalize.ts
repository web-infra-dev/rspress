import { extname, join, relative, sep } from 'node:path';
import {
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  isExternalUrl,
  slash,
  withBase,
} from '@rspress/shared';
import type {
  CustomLinkMeta,
  DirSideMeta,
  DividerSideMeta,
  FileSideMeta,
  SectionHeaderMeta,
  SideMetaItem,
} from './type';
import {
  extractInfoFromFrontmatter,
  extractInfoFromFrontmatterWithRealPath,
  pathExists,
  readJson,
} from './utils';

function getHmrFileKey(realPath: string | undefined, docsDir: string) {
  return realPath
    ? slash(relative(docsDir, realPath).replace(extname(realPath), ''))
    : '';
}

function absolutePathToLink(
  absolutePath: string,
  docsDir: string,
  routePrefix: string,
): string {
  const relativePath = slash(
    relative(docsDir, absolutePath.replace(extname(absolutePath), '')),
  );
  return `${routePrefix}${relativePath}`;
}

async function metaItemToSidebarItem(
  metaItem: SideMetaItem,
  baseDir: string,
  docsDir: string,
  extensions: string[],
  routePrefix: string,
): Promise<SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader> {
  if (typeof metaItem === 'string') {
    return metaFileItemToSidebarItem(
      metaItem,
      baseDir,
      docsDir,
      extensions,
      routePrefix,
    );
  }

  const { type } = metaItem;
  if (type === 'file') {
    return metaFileItemToSidebarItem(
      metaItem,
      baseDir,
      docsDir,
      extensions,
      routePrefix,
    );
  }

  if (type === 'dir') {
    const {
      name,
      label,
      collapsible,
      collapsed,
      tag,
      context,
      overviewHeaders,
    } = metaItem;
    const absolutePath = join(baseDir, name);
    const link = absolutePathToLink(absolutePath, docsDir, routePrefix);

    const dirMetaJsonPath = join(absolutePath, '_meta.json');
    const isMetaJsonExist = await pathExists(dirMetaJsonPath);

    if (isMetaJsonExist) {
      const dirMetaJson = await readJson<SideMetaItem[]>(dirMetaJsonPath);
      const isMetaJsonIndexExist = dirMetaJson.find(i => {
        if (typeof i === 'string') {
          return i.replace(extname(i), '') === 'index';
        }
        return false;
      });

      const items = await Promise.all(
        dirMetaJson.map(item =>
          metaItemToSidebarItem(
            item,
            baseDir,
            docsDir,
            extensions,
            routePrefix,
          ),
        ),
      );

      const { context: frontmatterContext = context, title } = absolutePath
        ? await extractInfoFromFrontmatterWithRealPath(absolutePath, docsDir)
        : ({} as { context: undefined; title: undefined });

      function getDirLabelName(): string {
        const dirName = name;

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
        items,
        link: isMetaJsonIndexExist ? undefined : link,
        tag,
        overviewHeaders,
        context: frontmatterContext,
        _fileKey: getHmrFileKey(absolutePath, docsDir),
      } satisfies SidebarGroup;
    }
  }

  if (type === 'custom-link') {
    return metaCustomLinkItemToSidebarItem(metaItem, routePrefix);
  }
  if (type === 'divider' || type === 'section-header') {
    return metaDividerToSidebarItem(metaItem);
  }

  throw new Error(
    `Unknown meta item type: ${(metaItem as any).type}, please check it in "${join(baseDir, '_meta.json')}".`,
  );
}

async function metaFileItemToSidebarItem(
  metaItemRaw: FileSideMeta | string,
  baseDir: string,
  docsDir: string,
  extensions: string[],
  routePrefix: string,
): Promise<SidebarItem> {
  let metaItem: FileSideMeta | null = null;
  if (typeof metaItemRaw === 'string') {
    metaItem = {
      name: metaItemRaw,
      type: 'file',
    };
  } else {
    metaItem = metaItemRaw;
  }

  const { name, context, label, overviewHeaders, tag } = metaItem;
  const absolutePath = join(baseDir, name);

  const link = absolutePathToLink(absolutePath, docsDir, routePrefix);

  const info = await extractInfoFromFrontmatter(
    absolutePath,
    docsDir,
    extensions,
  );
  const title = label || info.title;
  const realPath = info.realPath;
  return {
    text: title,
    link,
    tag,
    overviewHeaders: info.overviewHeaders
      ? info.overviewHeaders
      : overviewHeaders,
    context: info.context ? info.context : context,
    _fileKey: getHmrFileKey(realPath, docsDir),
  } satisfies SidebarItem;
}

function metaCustomLinkItemToSidebarItem(
  metaItem: CustomLinkMeta,
  routePrefix: string,
): SidebarItem {
  const { label, link, context, tag } = metaItem;
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
}

function metaDividerToSidebarItem(
  metaItem: DividerSideMeta | SectionHeaderMeta,
): SidebarDivider | SidebarSectionHeader {
  const { type } = metaItem;
  if (type === 'divider') {
    const { dashed } = metaItem;
    return {
      dividerType: dashed ? 'dashed' : 'solid',
    } satisfies SidebarDivider;
  }

  // section header
  const { label, tag } = metaItem;
  return {
    sectionHeaderText: label ?? '',
    tag,
  } satisfies SidebarSectionHeader;
}
