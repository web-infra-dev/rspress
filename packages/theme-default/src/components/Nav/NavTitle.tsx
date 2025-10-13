import {
  addLeadingSlash,
  normalizeImagePath,
  useLocaleSiteData,
  useSite,
} from '@rspress/runtime';
import { Link } from '@theme';
import { useMemo } from 'react';

export const NavTitle = () => {
  const { site } = useSite();
  const localeData = useLocaleSiteData();
  const { logo: rawLogo, logoText } = site;
  const title = (localeData.title ?? site.title) || 'Home';
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
    <div className="rp-nav__title">
      <Link
        href={addLeadingSlash(localeData.langRoutePrefix ?? '/')}
        className="rp-nav__title__link"
      >
        {logo && <div className="rp-nav__title__logo">{logo}</div>}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </Link>
    </div>
  );
};
