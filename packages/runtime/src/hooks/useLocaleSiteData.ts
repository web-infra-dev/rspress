import { addTrailingSlash, type NormalizedLocales } from '@rspress/shared';
import { useLang } from './useLang';
import { useSiteData } from './useSiteData';

export function useLocaleSiteData(): NormalizedLocales {
  const { site } = useSiteData();
  const lang = useLang();

  const themeConfig = site?.themeConfig ?? {};
  const defaultLang = site.lang ?? '';
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
      overview: themeConfig.overview,
    } as NormalizedLocales;
  }
  const localeInfo = locales.find(locale => locale.lang === lang)!;

  return {
    ...localeInfo,
    langRoutePrefix: lang === defaultLang ? '/' : addTrailingSlash(lang),
  } as NormalizedLocales;
}
