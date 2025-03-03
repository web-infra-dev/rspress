import { normalizeImagePath, usePageData } from '@rspress/runtime';
import { Link } from '@theme';
import { useMemo } from 'react';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import styles from './index.module.scss';

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
          className="rspress-logo"
        />
      );
    }
    return (
      <>
        <img
          src={normalizeImagePath(rawLogo.light)}
          alt="logo"
          id="logo"
          className="rspress-logo dark:hidden"
        />
        <img
          src={normalizeImagePath(rawLogo.dark)}
          alt="logo"
          id="logo"
          className="rspress-logo hidden dark:block"
        />
      </>
    );
  }, [rawLogo]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <Link
        href={localeData.langRoutePrefix}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logo && <div className="mr-1 min-w-8">{logo}</div>}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </Link>
    </div>
  );
};
