import type { I18nText } from '@rspress/core';

export const DEFAULT_I18N_TEXT = {
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
    en: '📝 Edit this page on GitHub',
    zh: '📝 在 GitHub 上编辑此页',
  },
  codeButtonGroupCopyButtonText: {
    en: 'Copy code',
    zh: '复制代码',
  },
} as const satisfies Required<I18nText>;
