import {
  addLeadingSlash,
  normalizeHrefInRuntime,
  removeBase,
  useLocation,
  usePageData,
  useVersion,
} from '@rspress/runtime';
import Translator from '@theme-assets/translator';
import { SvgWrapper } from '../SvgWrapper';

function replaceLang(
  rawUrl: string,
  lang: {
    current: string;
    target: string;
    default: string;
  },
  version: {
    current: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = '/';
  }

  url = normalizeHrefInRuntime(url);

  let versionPart = '';
  let langPart = '';
  let purePathPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.current && version.current !== version.default) {
    versionPart = parts.shift() || '';
  }

  // Should we remove the lang part?
  // The answer is as follows:
  if (lang.target !== lang.default) {
    langPart = lang.target;
    if (lang.current !== lang.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  purePathPart = parts.join('/') || '';

  if ((versionPart || langPart) && !purePathPart) {
    purePathPart = cleanUrls ? 'index' : 'index.html';
  }

  return addLeadingSlash(
    [versionPart, langPart, purePathPart].filter(Boolean).join('/'),
  );
}

export function useLangsMenu() {
  const { siteData, page } = usePageData();
  const currentVersion = useVersion();
  const { pathname, search } = useLocation();
  const defaultLang = siteData.lang || '';
  const defaultVersion = siteData.multiVersion.default || '';
  const localeLanguages = Object.values(
    siteData.locales || siteData.themeConfig.locales || {},
  );
  const cleanUrls = siteData.route?.cleanUrls || false;
  const hasMultiLanguage = localeLanguages.length > 1;
  const { lang: currentLang, pageType } = page;

  const translationMenuData = hasMultiLanguage
    ? {
        items: localeLanguages.map(item => ({
          text: item?.label,
          link: replaceLang(
            pathname + search,
            {
              current: currentLang,
              target: item.lang,
              default: defaultLang,
            },
            {
              current: currentVersion,
              default: defaultVersion,
            },
            cleanUrls,
            pageType === '404',
          ),
        })),
        activeValue: localeLanguages.find(item => currentLang === item.lang)
          ?.label,
      }
    : { items: [] };
  return translationMenuData;
}

function replaceVersion(
  rawUrl: string,
  version: {
    current: string;
    target: string;
    default: string;
  },
  cleanUrls: boolean,
  isPageNotFound: boolean,
) {
  let url = removeBase(rawUrl);
  // rspress.rs/builder + switch to en -> rspress.rs/builder/en/index.html
  if (!url || isPageNotFound) {
    url = normalizeHrefInRuntime('/');
  }
  let versionPart = '';

  const parts = url.split('/').filter(Boolean);

  if (version.target !== version.default) {
    versionPart = version.target;
    if (version.current !== version.default) {
      parts.shift();
    }
  } else {
    parts.shift();
  }

  let restPart = parts.join('/') || '';

  if (versionPart && !restPart) {
    restPart = cleanUrls ? 'index' : 'index.html';
  }

  return addLeadingSlash([versionPart, restPart].filter(Boolean).join('/'));
}

export function useVersionMenu() {
  const { siteData, page } = usePageData();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const cleanUrls = siteData.route?.cleanUrls || false;
  const defaultVersion = siteData.multiVersion.default || '';
  const versions = siteData.multiVersion.versions || [];
  const versionsMenuData = {
    items: versions.map(version => ({
      text: version,
      link: replaceVersion(
        pathname,
        {
          current: currentVersion,
          target: version,
          default: defaultVersion,
        },
        cleanUrls,
        page.pageType === '404',
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return versionsMenuData;
}
