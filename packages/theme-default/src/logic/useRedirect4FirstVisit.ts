import { removeBase, usePageData, withBase } from '@rspress/runtime';
import { useEffect } from 'react';

/**
 * Redirect to current locale for first visit
 */
export function useRedirect4FirstVisit() {
  const { siteData, page } = usePageData();
  const defaultLang = siteData.lang || '';
  const localeLanguages = Object.values(siteData.themeConfig.locales || {});
  const langs = localeLanguages.map(item => item.lang) || [];
  const currentLang = page.lang;

  useEffect(() => {
    const localeRedirect = siteData.themeConfig.localeRedirect ?? 'auto';
    if (localeRedirect !== 'auto') {
      return;
    }

    if (!defaultLang || process.env.TEST === '1') {
      // Check the window.navigator.language to determine the default language
      // If the default language is not the same as the current language, redirect to the default language
      // The default language will not have a lang prefix in the URL
      return;
    }

    const botRegex = /bot|spider|crawl|lighthouse/i;
    // If the request is coming from a bot or crawler, do not redirect.
    // this ensures that Google's search crawler can work as expected.
    if (botRegex.test(window.navigator.userAgent)) {
      return;
    }

    // Normalize current url, to ensure that the home url is always with a trailing slash
    const { pathname, search } = window.location;
    const cleanPathname = removeBase(pathname);
    // Check if the user is visiting the site for the first time
    const FIRST_VISIT_KEY = 'rspress-visited';
    const visited = localStorage.getItem(FIRST_VISIT_KEY);
    if (visited) {
      return;
    }

    localStorage.setItem(FIRST_VISIT_KEY, '1');

    const targetLang = window.navigator.language.split('-')[0];
    if (!langs.includes(targetLang)) {
      return;
    }
    if (targetLang === currentLang) {
      return;
    }
    let newPath: string;
    if (targetLang === defaultLang) {
      // Redirect to the default language
      newPath = pathname.replace(`/${currentLang}`, '');
    } else if (currentLang === defaultLang) {
      // Redirect to the current language
      newPath = withBase(`/${targetLang}${cleanPathname}`);
    } else {
      // Redirect to the current language
      newPath = pathname.replace(`/${currentLang}`, `/${targetLang}`);
    }
    if (newPath) {
      window.location.replace(newPath + search);
    }
  }, []);
}
