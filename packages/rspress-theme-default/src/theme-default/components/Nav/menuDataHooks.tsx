import { replaceLang, replaceVersion } from '@rspress/shared';
import { useLocation, usePageData, useVersion } from '@rspress/runtime';
import Translator from '../../assets/translator.svg';

export function useTranslationMenuData() {
  const { siteData, page } = usePageData();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
  const defaultLang = siteData.lang || '';
  const defaultVersion = siteData.multiVersion.default || '';
  const localeLanguages = Object.values(
    siteData.locales || siteData.themeConfig.locales || {},
  );
  const hasMultiLanguage = localeLanguages.length > 1;
  const { lang: currentLang } = page;
  const { base } = siteData;

  const translationMenuData = hasMultiLanguage
    ? {
        text: (
          <Translator
            style={{
              width: '18px',
              height: '18px',
            }}
          />
        ),
        items: localeLanguages.map(item => ({
          text: item?.label,
          link: replaceLang(
            pathname,
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
          ),
        })),
        activeValue: localeLanguages.find(item => currentLang === item.lang)
          ?.label,
      }
    : null;
  return translationMenuData;
}

export function useVersionMenuData() {
  const { siteData } = usePageData();
  const currentVersion = useVersion();
  const { pathname } = useLocation();
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
      ),
    })),
    text: currentVersion,
    activeValue: currentVersion,
  };
  return versionsMenuData;
}
