import {
  useLocation,
  useNavigate,
  usePageData,
  useVersion,
} from '@rspress/runtime';
import { replaceLang } from '@rspress/shared';
import { useEffect } from 'react';

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

  const saveUserPreferredLanguage =
    siteData.themeConfig.saveUserPreferredLanguage ?? 'auto';

  const checkDisableStorage = () => {
    const botRegex = /bot|spider|crawl|lighthouse/i;
    return (
      saveUserPreferredLanguage === 'never' ||
      !hasMultiLanguage ||
      // If the request is coming from a bot or crawler, do not redirect.
      // this ensures that Google's search crawler can work as expected.
      botRegex.test(window.navigator.userAgent)
    );
  };
  const getPreferredLanguage = () => {
    return localStorage.getItem(PREFERRED_LANG_KEY);
  };

  const setPreferredLanguage = (lang: string) => {
    const preferredLang = getPreferredLanguage();
    if (!lang || lang === preferredLang || checkDisableStorage()) {
      return;
    }
    localStorage.setItem(PREFERRED_LANG_KEY, lang);
  };

  useEffect(() => {
    if (
      checkDisableStorage() ||
      (saveUserPreferredLanguage === 'only-home-page' && pageType !== 'home') // only redirect in home page
    ) {
      //  no need to redirect
      return;
    }
    const preferredLang = getPreferredLanguage();
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
    getPreferredLanguage,
    setPreferredLanguage,
  } as const;
}
