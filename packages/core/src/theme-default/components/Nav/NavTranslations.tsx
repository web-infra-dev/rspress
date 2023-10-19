import { replaceLang } from '@rspress/shared';
import { NavMenuGroup } from './NavMenuGroup';
import styles from './index.module.scss';
import { useLocation, usePageData, useVersion } from '@/runtime';

export function NavTranslations() {
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
  return (
    <div
      className={`translation ${styles.menuItem} flex text-sm font-bold items-center px-3 py-2`}
    >
      <div>
        <NavMenuGroup {...translationMenuData} isTranslation />
      </div>
    </div>
  );
}
