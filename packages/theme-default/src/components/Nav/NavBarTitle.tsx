import { normalizeImagePath, usePageData } from '@rspress/runtime';
import { Link } from '@theme';
import { useMemo } from 'react';
import { useLocaleSiteData } from '../../logic/useLocaleSiteData';
import * as styles from './index.module.scss';

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
          className="rspress-logo dark:rp-hidden"
        />
        <img
          src={normalizeImagePath(rawLogo.dark)}
          alt="logo"
          id="logo"
          className="rspress-logo rp-hidden dark:rp-block"
        />
      </>
    );
  }, [rawLogo]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <Link
        href={localeData.langRoutePrefix}
        className="rp-flex rp-items-center rp-w-full rp-h-full rp-text-base rp-font-semibold rp-transition-opacity rp-duration-300 hover:rp-opacity-60"
      >
        {logo && <div className="rp-mr-1 rp-min-w-8">{logo}</div>}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </Link>
    </div>
  );
};
