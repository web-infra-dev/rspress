export type I18nTextValue = {
  zh: string;
  en: string;
  [key: string]: string;
};

export interface I18nText {
  languagesText?: I18nTextValue;
  versionsText?: I18nTextValue;
  themeText?: I18nTextValue;

  // outline
  menuTitle?: I18nTextValue;
  outlineTitle?: I18nTextValue;
  scrollToTopText?: I18nTextValue;

  // docFooter
  lastUpdatedText?: I18nTextValue;
  prevPageText?: I18nTextValue;
  nextPageText?: I18nTextValue;
  editLinkText?: I18nTextValue;

  sourceCodeText?: I18nTextValue;

  // search
  searchPlaceholderText?: I18nTextValue;
  searchPanelCancelText?: I18nTextValue;
  searchNoResultsText?: I18nTextValue;
  searchSuggestedQueryText?: I18nTextValue;

  // overview
  'overview.filterNameText'?: I18nTextValue;
  'overview.filterPlaceholderText'?: I18nTextValue;
  'overview.filterNoResultText'?: I18nTextValue;

  // codeblock
  codeButtonGroupCopyButtonText?: I18nTextValue;

  // NotFoundLayout
  notFoundText?: I18nTextValue;
  takeMeHomeText?: I18nTextValue;
}
