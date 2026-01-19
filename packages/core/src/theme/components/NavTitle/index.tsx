import {
  addLeadingSlash,
  addTrailingSlash,
  normalizeImagePath,
  useLang,
  useSite,
} from '@rspress/core/runtime';
import { Link } from '@theme';
import { useMemo } from 'react';
import './index.scss';

export const NavTitle = () => {
  const { site } = useSite();
  const lang = useLang();

  const themeConfig = site?.themeConfig ?? {};
  const defaultLang = site.lang ?? '';
  const locales = themeConfig?.locales;
  const localeInfo = locales?.find(locale => locale.lang === lang);

  const title = (localeInfo?.title ?? site.title) || 'Home';
  const langRoutePrefix =
    lang === defaultLang ? '/' : addTrailingSlash(lang);

  const { logo: rawLogo, logoText } = site;
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
        href={addLeadingSlash(langRoutePrefix)}
        className="rp-nav__title__link"
      >
        {logo && <div className="rp-nav__title__logo">{logo}</div>}
        {logoText && <span>{logoText}</span>}
        {!logo && !logoText && <span>{title}</span>}
      </Link>
    </div>
  );
};
