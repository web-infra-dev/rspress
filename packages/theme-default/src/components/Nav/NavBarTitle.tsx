import { useContext, useEffect, useState } from 'react';
import {
  ThemeContext,
  normalizeImagePath,
  usePageData,
  withBase,
} from '@rspress/runtime';
import styles from './index.module.scss';
import { getLogoUrl, useLocaleSiteData } from '../../logic';

export const NavBarTitle = () => {
  const { siteData } = usePageData();
  const localeData = useLocaleSiteData();
  const { logo: rawLogo, logoText } = siteData;
  const title = localeData.title ?? siteData.title;
  const { theme } = useContext(ThemeContext);
  const [logo, setLogo] = useState(getLogoUrl(rawLogo, theme));
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    setLogoVisible(true);
    const newLogoUrl = getLogoUrl(rawLogo, theme);
    setLogo(newLogoUrl);
  }, [theme, rawLogo]);

  return (
    <div className={`${styles.navBarTitle}`}>
      <a
        href={withBase(localeData.langRoutePrefix || '/')}
        className="flex items-center w-full h-full text-base font-semibold transition-opacity duration-300 hover:opacity-60"
      >
        {logo && logoVisible && (
          <img
            src={normalizeImagePath(logo)}
            alt="logo"
            id="logo"
            className="mr-4 rspress-logo"
          />
        )}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </a>
    </div>
  );
};
