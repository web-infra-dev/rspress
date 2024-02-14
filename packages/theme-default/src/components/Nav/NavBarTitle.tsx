import { useContext, useEffect, useState } from 'react';
import {
  ThemeContext,
  normalizeImagePath,
  usePageData,
  withBase,
} from '@rspress/runtime';
import styles from './index.module.scss';
import { getLogoUrl, useLocaleSiteData } from '#theme/logic';

export const NavBarTitle = () => {
  const { siteData } = usePageData();
  const localeData = useLocaleSiteData();
  const { logo: rawLogo } = siteData;
  const title = localeData.title ?? siteData.title;
  const { theme } = useContext(ThemeContext);
  const [logo, setLogo] = useState(getLogoUrl(rawLogo, theme));

  useEffect(() => {
    setLogo(getLogoUrl(rawLogo, theme));
  }, [theme]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <a
        href={withBase(localeData.langRoutePrefix || '/')}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logo ? (
          <img
            src={normalizeImagePath(logo)}
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
