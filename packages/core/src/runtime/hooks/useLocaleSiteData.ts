import { addTrailingSlash, type NormalizedLocales } from '@rspress/shared';
import { useLang } from './useLang';
import { useSite } from './useSite';

/**
 * @deprecated should use useSite and useLang instead
 *
 * ```ts
 * const site = useSite();
 * const lang = useLang();
 * const locales = site.themeConfig.locales;
 * const localeInfo = locales?.find((locale) => locale.lang === lang);
 * ```
 *
 * For i18n text:
 * ```ts
 * const t = useI18n();
 * <div>{t('outlineTitle')}</div>;
 * ```
 */
export function useLocaleSiteData(): NormalizedLocales {
  const { site } = useSite();
  const lang = useLang();

  const themeConfig = site?.themeConfig ?? {};
  const defaultLang = site.lang ?? '';
  const locales = themeConfig?.locales;
  if (!locales || locales.length === 0) {
    return {
      nav: themeConfig.nav,
      sidebar: themeConfig.sidebar,
    } as NormalizedLocales;
  }
  const localeInfo = locales.find(locale => locale.lang === lang)!;

  return {
    ...localeInfo,
    langRoutePrefix: lang === defaultLang ? '/' : addTrailingSlash(lang),
  } as NormalizedLocales;
}
