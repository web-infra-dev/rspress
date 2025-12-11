import {
  addLeadingSlash,
  normalizeImagePath,
  useLocaleSiteData,
  useSite,
} from '@rspress/core/runtime';
import { Link } from '@theme';
import { useMemo } from 'react';
import './NavTitle.scss';

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
          className="rspress-logo rp-nav__title__logo-image"
        />
      );
    }
    return (
      <>
        <img
          src={normalizeImagePath(rawLogo.light)}
          alt="logo"
          id="logo"
          className="rspress-logo rp-nav__title__logo-image rp-nav__title__logo-image--light"
        />
        <img
          src={normalizeImagePath(rawLogo.dark)}
          alt="logo"
          id="logo"
          className="rspress-logo rp-nav__title__logo-image rp-nav__title__logo-image--dark"
        />
      </>
    );
  }, [rawLogo]);

  return (
    <div className="rp-nav__title">
      <Link
        href={addLeadingSlash((localeData as any).langRoutePrefix ?? '/')}
        className="rp-nav__title__link"
      >
        {logo && <div className="rp-nav__title__logo">{logo}</div>}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </Link>
    </div>
  );
};
