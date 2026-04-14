import { type PageData, SEARCH_INDEX_NAME } from '@rspress/shared';
import { groupBy } from '@rspress/shared/lodash-es';
import { extractPageData } from '../../route/extractPageData';
import { FRAMEWORK_FALLBACK_404_FILEPATH } from '../../route/RoutePage';
import { createHash } from '../../utils';
import type { FactoryContext } from '../types';

function deletePrivateField<T>(obj: T): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  const newObj: T = { ...obj };
  for (const key in newObj) {
    if (key.startsWith('_')) {
      delete newObj[key];
    }
  }
  return newObj;
}

export async function createPageData(context: FactoryContext): Promise<{
  filepaths: string[]; // for addDependencies
  pageData: PageData;
  searchIndex: Record<string, string>;
  indexHashByGroup: Record<string, string>;
}> {
  const { config, alias, userDocRoot, routeService, pluginDriver } = context;
  const userConfig = config;
  // prevent modify the origin config object
  const tempSearchObj = Object.assign({}, userConfig.search);

  // searchHooks is a absolute path which may leak information
  if (tempSearchObj) {
    tempSearchObj.searchHooks = undefined;
  }

  const replaceRules = userConfig?.replaceRules || [];

  const searchConfig = userConfig?.search;
  const searchEnabled = searchConfig !== false;

  // If the dev server restart when config file, we will reuse the siteData instead of extracting the siteData from source files again.
  const searchCodeBlocks =
    searchConfig &&
    typeof searchConfig === 'object' &&
    'codeBlocks' in searchConfig
      ? Boolean(searchConfig.codeBlocks)
      : true;

  const pages = await extractPageData(routeService, {
    replaceRules,
    alias,
    root: userDocRoot,
    searchCodeBlocks,
    extractDescription: userConfig.markdown?.extractDescription,
    searchEnabled,
  });
  const sourceBackedPages = pages.filter(
    page => page._filepath !== FRAMEWORK_FALLBACK_404_FILEPATH,
  );

  // Framework fallback 404 routes are virtual pages with no source file.
  // Keep them in runtime page data, but exclude them from source-backed
  // plugin/search pipelines that may read pageData._filepath.
  await pluginDriver.modifySearchIndexData(sourceBackedPages);

  const versioned =
    typeof userConfig.search !== 'boolean' &&
    (userConfig.search?.versioned ?? true);

  const groupedPages = groupBy(
    sourceBackedPages,
    (page: (typeof pages)[number]) => {
      if (page.frontmatter?.pageType === 'home') {
        return 'noindex';
      }

      const version = versioned ? page.version : '';
      const lang = page.lang || '';

      return `${version}###${lang}`;
    },
  );
  // remove the pages marked as noindex
  delete groupedPages.noindex;

  const indexHashByGroup = {} as Record<string, string>;

  const searchIndex = {} as Record<string, string>;
  // Generate search index by different versions & languages, file name is {SEARCH_INDEX_NAME}.{version}.{lang}.{hash}.json
  await Promise.all(
    Object.keys(groupedPages).map(async group => {
      // Avoid writing filepath in compile-time
      const stringifiedIndex = JSON.stringify(
        groupedPages[group].map(deletePrivateField),
      );
      const indexHash = createHash(stringifiedIndex);
      indexHashByGroup[group] = indexHash;

      const [version, lang] = group.split('###');
      const indexVersion = version ? `.${version.replace('.', '_')}` : '';
      const indexLang = lang ? `.${lang}` : '';

      const filename = `${SEARCH_INDEX_NAME}${indexVersion}${indexLang}.${indexHash}.json`;
      searchIndex[filename] = stringifiedIndex;
    }),
  );

  // Run extendPageData hook in plugins
  await Promise.all(
    sourceBackedPages.map(async pageData => pluginDriver.extendPageData(pageData)),
  );

  const filepaths: string[] = [];
  const pageData: PageData = {
    pages: pages.map(page => {
      // omit some fields for runtime size
      const { content: _content, _filepath, _flattenContent, ...rest } = page;
      if (_filepath && _filepath !== FRAMEWORK_FALLBACK_404_FILEPATH) {
        filepaths.push(_filepath);
      }
      return rest;
    }),
  };

  return {
    filepaths,
    pageData,
    searchIndex,
    indexHashByGroup,
  };
}
