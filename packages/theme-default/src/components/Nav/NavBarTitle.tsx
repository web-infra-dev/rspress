import { useContext, useMemo } from 'react';
import {
  ThemeContext,
  normalizeImagePath,
  usePageData,
  withBase,
} from '@rspress/runtime';
import styles from './index.module.scss';
import { useLocaleSiteData } from '../../logic';

export const NavBarTitle = () => {
  const { siteData } = usePageData();
  const localeData = useLocaleSiteData();
  const { logo: rawLogo } = siteData;
  const title = localeData.title ?? siteData.title;
  const { theme } = useContext(ThemeContext);
  const logoUrl = useMemo(() => {
    let logo;
    // If logo is a string, use it directly
    if (typeof rawLogo === 'string') {
      logo = rawLogo;
    } else {
      // If logo is an object, use dark/light mode logo
      logo = theme === 'dark' ? rawLogo.dark : rawLogo.light;
    }
    return normalizeImagePath(logo);
  }, [theme]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <a
        href={withBase(localeData.langRoutePrefix || '/')}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="logo"
            id="logo"
            className="mr-4 rspress-logo"
          />
        ) : (
          <span>{title}</span>
        )}
      </a>
    </div>
  );
};
