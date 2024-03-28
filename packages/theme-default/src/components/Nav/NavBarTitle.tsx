import { useMemo } from 'react';
import { normalizeImagePath, usePageData, withBase } from '@rspress/runtime';
import styles from './index.module.scss';
import { useLocaleSiteData } from '../../logic';

export const NavBarTitle = () => {
  const { siteData } = usePageData();
  const localeData = useLocaleSiteData();
  const { logo: rawLogo, logoText } = siteData;
  const title = localeData.title ?? siteData.title;
  const logo = useMemo(() => {
    if (!rawLogo) {
      return null;
    }
    if (typeof rawLogo === 'string') {
      return (
        <img
          src={normalizeImagePath(rawLogo)}
          alt="logo"
          id="logo"
          className="mr-4 rspress-logo"
        />
      );
    }
    return (
      <>
        <img
          src={normalizeImagePath(rawLogo.light)}
          alt="logo"
          id="logo"
          className="mr-4 rspress-logo dark:hidden"
        />
        <img
          src={normalizeImagePath(rawLogo.dark)}
          alt="logo"
          id="logo"
          className="mr-4 rspress-logo hidden dark:block"
        />
      </>
    );
  }, [rawLogo]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <a
        href={withBase(localeData.langRoutePrefix || '/')}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logo}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </a>
    </div>
  );
};
