export interface I18nText {
  languagesText?: {
    /**
     * @default '语言'
     */
    zh: string;
    /**
     * @default 'Languages'
     */
    en: string;
    [key: string]: string;
  };
  versionsText?: {
    /**
     * @default '版本'
     */
    zh: string;
    /**
     * @default 'Versions'
     */
    en: string;
    [key: string]: string;
  };
  themeText?: {
    /**
     * @default '主题'
     */
    zh: string;
    /**
     * @default 'Theme'
     */
    en: string;
    [key: string]: string;
  };
  menuTitle?: {
    /**
     * @default '菜单'
     */
    zh: string;
    /**
     * @default 'Menu'
     */
    en: string;
    [key: string]: string;
  };
  scrollToTopText?: {
    /**
     * @default '回到顶部'
     */
    zh: string;
    /**
     * @default 'Back to top'
     */
    en: string;
    [key: string]: string;
  };
  /**
   * Custom outline title in the outline component.
   */
  outlineTitle?: {
    /**
     * @default '目录'
     */
    zh: string;
    /**
     * @default 'ON THIS PAGE'
     */
    en: string;
    [key: string]: string;
  };
  lastUpdatedText?: {
    /**
     * @default 'Last Updated'
     */
    en: string;
    /**
     * @default '最后更新于'
     */
    zh: string;
    [key: string]: string;
  };
  prevPageText?: {
    /**
     * @default 'Previous page'
     */
    en: string;
    /**
     * @default '上一页'
     */
    zh: string;
    [key: string]: string;
  };
  nextPageText?: {
    /**
     * @default 'Next page'
     */
    en: string;
    /**
     * @default '下一页'
     */
    zh: string;
    [key: string]: string;
  };
  sourceCodeText?: {
    /**
     * @default 'Source Code'
     */
    en: string;
    /**
     * @default '源码'
     */
    zh: string;
    [key: string]: string;
  };
  searchPlaceholderText?: {
    /**
     * @default 'Search'
     */
    en: string;
    /**
     * @default '搜索'
     */
    zh: string;
    [key: string]: string;
  };
  searchPanelCancelText?: {
    /**
     * @default 'Cancel'
     */
    en: string;
    /**
     * @default '取消'
     */
    zh: string;
    [key: string]: string;
  };
  searchNoResultsText?: {
    /**
     * @default 'No results for'
     */
    en: string;
    /**
     * @default '未找到与之匹配的结果'
     */
    zh: string;
    [key: string]: string;
  };
  searchSuggestedQueryText?: {
    /**
     * @default 'Please try again with a different keyword'
     */
    en: string;
    /**
     * @default '试试搜索不同关键词'
     */
    zh: string;
    [key: string]: string;
  };
  ['overview.filterNameText']?: {
    /**
     * @default 'Filter
     */
    en: string;
    /**
     * @default '筛选'
     */
    zh: string;
    [key: string]: string;
  };
  ['overview.filterPlaceholderText']?: {
    /**
     * @default 'Search APIs'
     */
    en: string;
    /**
     * @default '搜索 API'
     */
    zh: string;
    [key: string]: string;
  };
  ['overview.filterNoResultText']?: {
    /**
     * @default '未找到匹配的 API'
     */
    zh: string;
    /**
     * @default 'No matching API found'
     */
    en: string;
    [key: string]: string;
  };
  editLinkText?: {
    /**
     * @default '编辑此页面'
     */
    zh: string;
    /**
     * @default 'Edit this page'
     */
    en: string;
    [key: string]: string;
  };
  codeButtonGroupCopyButtonText?: {
    /**
     * @default '复制代码'
     */
    zh: string;
    /**
     * @default 'Copy code'
     */
    en: string;
    [key: string]: string;
  };
}
