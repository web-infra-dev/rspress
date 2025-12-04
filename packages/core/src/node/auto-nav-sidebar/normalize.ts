import { stat as fsStat, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import {
  isExternalUrl,
  type SidebarDivider,
  type SidebarGroup,
  type SidebarItem,
  type SidebarSectionHeader,
  slash,
} from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { PUBLIC_DIR } from '../constants';
import { absolutePathToRoutePath, addRoutePrefix } from '../route/RoutePage';
import { createError } from '../utils';
import type {
  CustomLinkMeta,
  DirSectionHeaderSideMeta,
  DirSideMeta,
  DividerSideMeta,
  FileSideMeta,
  SectionHeaderMeta,
  SideMetaItem,
} from './type';
import {
  extractInfoFromFrontmatterWithAbsolutePath,
  pathExists,
  readJson,
} from './utils';

function getFileKey(realPath: string | undefined, docsDir: string) {
  return realPath
    ? slash(relative(docsDir, realPath).replace(extname(realPath), ''))
    : '';
}

async function fsDirToMetaItems(
  workDir: string,
  docsDir: string,
  extensions: string[],
): Promise<SideMetaItem[]> {
  let subItems: string[];
  try {
    subItems = await readdir(workDir);
  } catch (e) {
    logger.error(
      `Failed to read directory: ${workDir}, maybe it does not exist. Please check it in "_meta.json".`,
    );
    throw e;
  }
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

  const sideMeta: SideMetaItem[] = (
    await Promise.all(
      subItems.map<Promise<SideMetaItem | null>>(async item => {
        // Fix https://github.com/web-infra-dev/rspress/issues/346
        if (item === '_meta.json') {
          return null;
        }

        const stat = await fsStat(join(workDir, item));
        // If the item is a directory, we will transform it to a object with `type` and `name` property.
        if (stat.isDirectory()) {
          // ignore public folder
          if (item === PUBLIC_DIR && workDir === docsDir) {
            return null;
          }
          return {
            type: 'dir',
            name: item,
          } satisfies SideMetaItem;
        }
        return extensions.some(ext => item.endsWith(ext)) ? item : null;
      }),
    )
  ).filter(Boolean) as SideMetaItem[];

  return sideMeta;
}

async function metaItemToSidebarItem(
  metaItem: SideMetaItem,
  workDir: string,
  docsDir: string,
  extensions: string[],
  metaFileSet: Set<string>,
  mdFileSet: Set<string>,
): Promise<
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)
  | (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)[]
> {
  if (typeof metaItem === 'string') {
    return metaFileItemToSidebarItem(
      metaItem,
      workDir,
      docsDir,
      extensions,
      mdFileSet,
    );
  }

  const { type } = metaItem;
  if (type === 'file') {
    return metaFileItemToSidebarItem(
      metaItem,
      workDir,
      docsDir,
      extensions,
      mdFileSet,
    );
  }

  if (type === 'dir') {
    return metaDirItemToSidebarItem(
      metaItem,
      workDir,
      docsDir,
      extensions,
      metaFileSet,
      mdFileSet,
      false,
    );
  }

  if (type === 'dir-section-header') {
    return metaDirSectionHeaderItemToSidebarItem(
      metaItem,
      workDir,
      docsDir,
      extensions,
      metaFileSet,
      mdFileSet,
    );
  }

  if (type === 'custom-link') {
    return metaCustomLinkItemToSidebarItem(metaItem, workDir, docsDir);
  }
  if (type === 'divider') {
    return metaDividerToSidebarItem(metaItem);
  }
  if (type === 'section-header') {
    return metaSectionHeaderToSidebarItem(metaItem);
  }

  throw createError(
    `Unknown meta item type: ${(metaItem as any).type}, please check it in "${join(workDir, '_meta.json')}".`,
  );
}

async function detectFilePath(absolutePath: string, extensions: string[]) {
  const ext = extname(absolutePath);
  if (ext && extensions.includes(ext)) {
    return absolutePath;
  }

  for (const extension of extensions) {
    const realPath = absolutePath + extension;
    if (await pathExists(realPath)) {
      return realPath;
    }
  }

  throw createError(
    `The file extension "${ext}" is not supported, please use one of the following extensions: ${extensions.join(', ')}`,
  );
}

async function metaFileItemToSidebarItem(
  metaItemRaw: FileSideMeta | string,
  workDir: string,
  docsDir: string,
  extensions: string[],
  mdFileSet: Set<string>,
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

  if (typeof name !== 'string') {
    throw createError(
      `The file name "${name}" is not a string, please check it in "${join(workDir, '_meta.json')}".`,
    );
  }

  const absolutePath = join(workDir, name);

  let absolutePathWithExt: string;
  try {
    absolutePathWithExt = await detectFilePath(absolutePath, extensions);
  } catch {
    throw createError(
      `The file "${absolutePath}" does not exist, please check it in "${join(workDir, '_meta.json')}".`,
    );
  }

  const link = absolutePathToRoutePath(absolutePathWithExt, docsDir);
  const info = await extractInfoFromFrontmatterWithAbsolutePath(
    absolutePathWithExt,
    docsDir,
  );
  const title = label || info.title;
  mdFileSet.add(absolutePathWithExt);
  return {
    text: title,
    link,
    tag: info.tag || tag,
    overviewHeaders: info.overviewHeaders || overviewHeaders,
    context: info.context || context,
    _fileKey: getFileKey(absolutePathWithExt, docsDir),
  } satisfies SidebarItem;
}

async function metaDirItemToSidebarItem(
  metaItem: DirSideMeta,
  workDir: string,
  docsDir: string,
  extensions: string[],
  metaFileSet: Set<string>,
  mdFileSet: Set<string>,
  forceIndexFileAsItem: boolean,
): Promise<SidebarGroup> {
  const {
    name,
    label,
    collapsible,
    collapsed,
    tag: metaJsonTag,
    context: metaJsonContext,
    overviewHeaders: metaJsonOverviewHeaders,
  } = metaItem;
  const dirAbsolutePath = join(workDir, name);
  const dirMetaJsonPath = join(dirAbsolutePath, '_meta.json');
  const isMetaJsonExist = await pathExists(dirMetaJsonPath);

  let dirMetaJson: SideMetaItem[] = [];
  if (isMetaJsonExist) {
    metaFileSet.add(dirMetaJsonPath);
    dirMetaJson = await readJson<SideMetaItem[]>(dirMetaJsonPath);
  } else {
    dirMetaJson = await fsDirToMetaItems(dirAbsolutePath, docsDir, extensions);
  }

  async function getItems(
    withoutIndex: boolean = false,
  ): Promise<
    (SidebarItem | SidebarGroup | SidebarDivider | SidebarSectionHeader)[]
  > {
    const items = await Promise.all(
      (withoutIndex
        ? dirMetaJson.filter(i => {
            let name: string;
            if (typeof i === 'object' && 'type' in i && i.type === 'file') {
              name = i.name;
            } else if (typeof i === 'string') {
              name = i;
            } else {
              return true;
            }
            return name !== 'index.md' && i !== 'index.mdx' && i !== 'index';
          })
        : dirMetaJson
      ).map(item =>
        metaItemToSidebarItem(
          item,
          dirAbsolutePath,
          docsDir,
          extensions,
          metaFileSet,
          mdFileSet,
        ),
      ),
    );
    return items.flat();
  }

  try {
    // Category index convention, display a document when clicking on the sidebar directory
    // https://docusaurus.io/docs/sidebar/autogenerated#category-index-convention

    // 1. sameName /api folder, /api.md or /api.mdx,
    const sameNameFile = await metaFileItemToSidebarItem(
      name,
      workDir,
      docsDir,
      extensions,
      mdFileSet,
    );

    const { link, text, _fileKey, context, overviewHeaders, tag } =
      sameNameFile;
    return {
      text: label || text || name,
      collapsible,
      collapsed,
      items: await getItems(),
      link,
      tag: metaJsonTag || tag,
      overviewHeaders: metaJsonOverviewHeaders || overviewHeaders,
      context: metaJsonContext || context,
      _fileKey,
    } satisfies SidebarGroup;
  } catch (e) {
    logger.debug(e);
    const isIndexInMetaJsonIndex = dirMetaJson.find(i => {
      if (typeof i === 'string') {
        return i.replace(extname(i), '') === 'index';
      }
      return false;
    });

    // 2. if "index.mdx" or "index.md" or "index" is in _meta.json || "index" file not exists, index page should be placed to child sidebar, the directory itself is not clickable
    const isIndexFileExists =
      (await pathExists(join(dirAbsolutePath, 'index.mdx'))) ||
      (await pathExists(join(dirAbsolutePath, 'index.md')));

    if ((isMetaJsonExist && isIndexInMetaJsonIndex) || !isIndexFileExists) {
      return {
        text: label || name,
        collapsible,
        collapsed,
        items: await getItems(),
        overviewHeaders: metaJsonOverviewHeaders,
        context: metaJsonContext,
        _fileKey: getFileKey(dirAbsolutePath, docsDir),
      } satisfies SidebarGroup;
    } else {
      // 3. if not, index page should be placed to child sidebar, the directory itself is not clickable
      const indexFile = await metaFileItemToSidebarItem(
        'index',
        dirAbsolutePath,
        docsDir,
        extensions,
        mdFileSet,
      );

      const { link, text, _fileKey, context, overviewHeaders, tag } = indexFile;
      return {
        text: label || text || name,
        collapsible,
        collapsed,
        items: await getItems(!forceIndexFileAsItem),
        link,
        tag: metaJsonTag || tag,
        overviewHeaders: metaJsonOverviewHeaders || overviewHeaders,
        context: metaJsonContext || context,
        _fileKey,
      } satisfies SidebarGroup;
    }
  }
}

async function metaDirSectionHeaderItemToSidebarItem(
  metaItem: DirSectionHeaderSideMeta,
  workDir: string,
  docsDir: string,
  extensions: string[],
  metaFileSet: Set<string>,
  mdFileSet: Set<string>,
): Promise<
  (SidebarItem | SidebarSectionHeader | SidebarGroup | SidebarDivider)[]
> {
  const fakeDirMetaItem: DirSideMeta = {
    ...metaItem,
    type: 'dir',
  };

  const fakeSectionHeaderMetaItem: SectionHeaderMeta = {
    label: metaItem.label,
    tag: metaItem.tag,
    type: 'section-header',
  };

  const dirSideGroup = await metaDirItemToSidebarItem(
    fakeDirMetaItem,
    workDir,
    docsDir,
    extensions,
    metaFileSet,
    mdFileSet,
    true,
  );
  const sectionHeaderSideItem = metaSectionHeaderToSidebarItem(
    fakeSectionHeaderMetaItem,
  );

  return [
    sectionHeaderSideItem,
    ...(dirSideGroup.items.length >= 1 ? dirSideGroup.items : []),
  ];
}

function metaCustomLinkItemToSidebarItem(
  metaItem: CustomLinkMeta,
  workDir: string,
  docsDir: string,
): SidebarItem | SidebarGroup {
  if (
    'items' in metaItem &&
    Array.isArray(metaItem.items) &&
    metaItem.items.length > 0
  ) {
    const {
      label,
      link,
      context,
      items,
      tag,
      collapsed,
      collapsible,
      overviewHeaders,
    } = metaItem;
    return {
      text: label ?? link,
      context,
      tag,
      link,
      items: items.map(subItem =>
        metaCustomLinkItemToSidebarItem(
          Object.assign(subItem, { type: 'custom-link' }),
          workDir,
          docsDir,
        ),
      ),
      collapsed,
      collapsible,
      overviewHeaders,
    } satisfies SidebarGroup;
  }
  if ('link' in metaItem && typeof metaItem.link === 'string') {
    const { label, link, context, tag } = metaItem;

    if (isExternalUrl(link)) {
      return {
        text: label ?? link,
        link,
        tag,
        context,
      } satisfies SidebarItem;
    }

    return {
      text: label ?? link,
      link: addRoutePrefix(workDir, docsDir, link),
      tag,
      context,
    } satisfies SidebarItem;
  }

  const { label } = metaItem;
  throw createError(
    `The custom link "${label}" does not have a link, please check it in "${join(workDir, '_meta.json')}".`,
  );
}

function metaDividerToSidebarItem(metaItem: DividerSideMeta) {
  const { dashed } = metaItem;
  return {
    dividerType: dashed ? 'dashed' : 'solid',
  } satisfies SidebarDivider;
}

function metaSectionHeaderToSidebarItem(
  metaItem: SectionHeaderMeta,
): SidebarSectionHeader {
  // section header
  const { label, tag } = metaItem;
  return {
    sectionHeaderText: label ?? '',
    tag,
  } satisfies SidebarSectionHeader;
}

async function scanSideMeta(
  workDir: string,
  docsDir: string,
  extensions: string[],
  metaFileSet: Set<string>,
  mdFileSet: Set<string>,
) {
  const dir = await metaDirItemToSidebarItem(
    {
      type: 'dir',
      name: '',
    },
    workDir,
    docsDir,
    extensions,
    metaFileSet,
    mdFileSet,
    true, // first dir
  );
  return dir.items;
}

export { scanSideMeta };
