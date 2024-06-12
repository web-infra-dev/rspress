import type { NormalizedLocales } from '@rspress/shared';
import { usePageData } from '@rspress/runtime';

export function useLocaleSiteData(): NormalizedLocales {
  const pageData = usePageData();
  const {
    page: { lang },
  } = pageData;
  const themeConfig = pageData?.siteData?.themeConfig ?? {};
  const defaultLang = pageData.siteData.lang ?? '';
  const locales = themeConfig?.locales;
  if (!locales || locales.length === 0) {
    return {
      nav: themeConfig.nav,
      sidebar: themeConfig.sidebar,
      prevPageText: themeConfig.prevPageText,
      nextPageText: themeConfig.nextPageText,
      sourceCodeText: themeConfig.sourceCodeText,
      searchPlaceholderText: themeConfig.searchPlaceholderText,
      searchNoResultsText: themeConfig.searchNoResultsText,
      searchSuggestedQueryText: themeConfig.searchSuggestedQueryText,
    } as NormalizedLocales;
  }
  const localeInfo = locales.find(locale => locale.lang === lang)!;

  return {
    ...localeInfo,
    langRoutePrefix: lang === defaultLang ? '/' : lang,
  } as NormalizedLocales;
}
