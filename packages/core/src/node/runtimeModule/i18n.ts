import { createRequire } from 'node:module';
import { join } from 'node:path';
import type { I18nText, UserConfig } from '@rspress/shared';
import { logger } from '@rspress/shared/logger';
import { pathExists } from '../utils';
import { RuntimeModuleID, type VirtualModulePlugin } from './types';

const require = createRequire(import.meta.url);
const DEFAULT_I18N_SOURCE = join(process.cwd(), 'i18n.json');

const DEFAULT_I18N_TEXT = {
  languagesText: {
    zh: '语言',
    en: 'Languages',
  },
  themeText: {
    zh: '主题',
    en: 'Theme',
  },
  versionsText: {
    zh: '版本',
    en: 'Versions',
  },
  menuTitle: {
    zh: '菜单',
    en: 'Menu',
  },
  outlineTitle: {
    zh: '目录',
    en: 'ON THIS PAGE',
  },
  scrollToTopText: {
    en: 'Back to top',
    zh: '回到顶部',
  },
  lastUpdatedText: {
    en: 'Last Updated',
    zh: '最后更新于',
  },
  prevPageText: {
    en: 'Previous page',
    zh: '上一页',
  },
  nextPageText: {
    en: 'Next page',
    zh: '下一页',
  },
  sourceCodeText: {
    en: 'Source Code',
    zh: '源码',
  },
  searchPlaceholderText: {
    en: 'Search',
    zh: '搜索',
  },
  searchPanelCancelText: {
    en: 'Cancel',
    zh: '取消',
  },
  searchNoResultsText: {
    en: 'No matching results',
    zh: '未找到与之匹配的结果',
  },
  searchSuggestedQueryText: {
    en: 'Try searching for different keywords',
    zh: '试试搜索不同关键词',
  },
  'overview.filterNameText': {
    en: 'Filter',
    zh: '筛选',
  },
  'overview.filterPlaceholderText': {
    en: 'Search API',
    zh: '搜索 API',
  },
  'overview.filterNoResultText': {
    en: 'No matching API found',
    zh: '未找到匹配的 API',
  },
  editLinkText: {
    en: 'Edit this page',
    zh: '编辑此页',
  },
  codeButtonGroupCopyButtonText: {
    en: 'Copy code',
    zh: '复制代码',
  },
} as const satisfies Required<I18nText>;

function mergeI18nData(
  ...sources: Record<string, Record<string, string>>[]
): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  for (const source of sources) {
    for (const key in source) {
      if (!result[key]) {
        result[key] = {};
      }
      Object.assign(result[key], source[key]);
    }
  }
  return result;
}

export function getI18nData(
  docConfig: UserConfig,
): Record<string, Record<string, string>> {
  const {
    i18nSourcePath = DEFAULT_I18N_SOURCE,
    i18nSource = {},
    themeConfig,
  } = docConfig;

  const langs = themeConfig?.locales?.map(locale => locale.lang) ?? [];

  // 1. load i18n.json
  let i18nSourceFromJson: Record<string, Record<string, string>> = {};
  try {
    // require.cache is an API in Rslib.
    delete require.cache[i18nSourcePath];
    // eslint-disable-next-line import/no-dynamic-require
    i18nSourceFromJson = require(i18nSourcePath);
  } catch (e) {
    logger.debug('getI18nData from i18n.json Failed: \n', e);
  }

  // 2. load i18nSource from rspress.config.ts
  let i18nSourceFull: Record<string, Record<string, string>> = {};
  const i18nSourceFromJsonMergedWithDefault = mergeI18nData(
    DEFAULT_I18N_TEXT,
    i18nSourceFromJson,
  );
  if (typeof i18nSource === 'function') {
    try {
      i18nSourceFull = i18nSource(i18nSourceFromJsonMergedWithDefault);
    } catch (e) {
      logger.error(
        'getI18nData Failed to execute `i18nSource` function in `rspress.config.ts`: \n',
        e,
      );
    }
  } else {
    i18nSourceFull = i18nSourceFromJsonMergedWithDefault;
  }

  // 3. select langs from i18nSourceFull for treeshaking
  const filteredI18nSource: Record<string, Record<string, string>> = {};
  for (const key in i18nSourceFull) {
    filteredI18nSource[key] = {};
    for (const lang of langs) {
      if (i18nSourceFull[key][lang]) {
        filteredI18nSource[key][lang] = i18nSourceFull[key][lang];
      }
    }
    // always keep 'en' if exist
    if (i18nSourceFull[key]['en']) {
      filteredI18nSource[key]['en'] = i18nSourceFull[key]['en'];
    }
  }

  return filteredI18nSource;
}

/**
 * Generate i18n text for client runtime
 */
export const i18nVMPlugin: VirtualModulePlugin = context => {
  const { config } = context;
  return {
    [RuntimeModuleID.I18nText]: async ({
      addDependency,
      addMissingDependency,
    }) => {
      const configPath = config.i18nSourcePath || DEFAULT_I18N_SOURCE;

      const isExist = await pathExists(configPath);
      if (isExist) {
        addDependency(configPath);
      } else {
        addMissingDependency(configPath);
      }
      const i18nData = getI18nData(config);

      return `export default ${JSON.stringify(i18nData, null, 2)}`;
    },
  };
};
