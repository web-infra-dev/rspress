import { replaceLang, replaceVersion } from '@rspress/shared';
import { useLocation, usePageData, useVersion } from '@rspress/runtime';
import Translator from '@theme-assets/translator';
import { SvgWrapper } from '../SvgWrapper';

export function useTranslationMenuData() {
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
  const { base } = siteData;

  const translationMenuData = hasMultiLanguage
    ? {
        text: (
          <SvgWrapper
            icon={Translator}
            style={{
              width: '18px',
              height: '18px',
            }}
          />
        ),
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
            base,
            cleanUrls,
            pageType === '404',
          ),
        })),
        activeValue: localeLanguages.find(item => currentLang === item.lang)
          ?.label,
      }
    : null;
  return translationMenuData;
}

export function useVersionMenuData() {
  const { siteData, page } = usePageData();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const cleanUrls = siteData.route?.cleanUrls || false;
  const defaultVersion = siteData.multiVersion.default || '';
  const versions = siteData.multiVersion.versions || [];
  const { base } = siteData;
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
        base,
        cleanUrls,
        page.pageType === '404',
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return versionsMenuData;
}
