import {
  useLocation,
  useNavigate,
  usePageData,
  useVersion,
} from '@rspress/runtime';
import { replaceLang } from '@rspress/shared';
import { useEffect } from 'react';
import { useStorageValue } from './useStorageValue';

/**
 * Redirect to preferred locale
 */
export function usePreferredLanguage() {
  const { siteData, page } = usePageData();
  const currentVersion = useVersion();
  const defaultLang = siteData.lang || '';
  const localeLanguages = Object.values(
    siteData.locales || siteData.themeConfig.locales || {},
  );
  const hasMultiLanguage = localeLanguages.length > 1;
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const { lang: currentLang, pageType } = page;
  const defaultVersion = siteData.multiVersion.default || '';
  const { base } = siteData;
  const PREFERRED_LANG_KEY = 'rspress-preferred-language';
  const [preferredLang, setLang] = useStorageValue<string>(
    PREFERRED_LANG_KEY,
    '',
  );

  const saveUserPreferredLanguage =
    siteData.themeConfig.saveUserPreferredLanguage ?? 'auto';

  const botRegex = /bot|spider|crawl|lighthouse/i;

  const disableStorage =
    saveUserPreferredLanguage === 'never' ||
    !hasMultiLanguage ||
    // If the request is coming from a bot or crawler, do not redirect.
    // this ensures that Google's search crawler can work as expected.
    botRegex.test(window.navigator.userAgent);

  const setPreferredLanguage = (lang: string) => {
    if (!lang || lang === preferredLang || disableStorage) {
      return;
    }
    setLang(lang);
  };

  useEffect(() => {
    if (
      disableStorage ||
      (saveUserPreferredLanguage === 'only-home-page' && pageType !== 'home') // only redirect in home page
    ) {
      //  no need to redirect
      return;
    }

    if (preferredLang && preferredLang !== currentLang) {
      const cleanUrls = siteData.route?.cleanUrls || false;
      const newPath = replaceLang(
        pathname + search,
        {
          current: currentLang,
          target: preferredLang,
          default: defaultLang,
        },
        {
          current: currentVersion,
          default: defaultVersion,
        },
        base,
        cleanUrls,
        pageType === '404',
      );
      navigate(newPath);
    }
  }, []);

  return {
    preferredLang,
    setPreferredLanguage,
  } as const;
}
