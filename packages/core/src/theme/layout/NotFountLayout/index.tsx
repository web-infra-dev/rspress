import { useI18n, usePageData } from '@rspress/core/runtime';
import { Link } from '@theme';
import './index.scss';

export function NotFoundLayout() {
  const { siteData, page } = usePageData();
  const defaultLang = siteData.lang;
  const defaultVersion = siteData.multiVersion.default;

  const t = useI18n();
  // Consider the existing sites include the defaultLang in some links, such as '/zh/guide/quick-start'
  // We need to redirect them to '/guide/quick-start'
  // In the meanwhile, we will not show the 404 page for the user experience
  if (defaultLang && typeof window !== 'undefined') {
    const regexp = new RegExp(`/${defaultLang}(\\/|$)`);
    if (regexp.test(location.pathname)) {
      const redirectUrl = location.pathname.replace(regexp, '/');
      window.location.replace(redirectUrl);
      return null;
    }
  }

  let root = '/';
  if (defaultVersion && page.version !== defaultVersion) {
    root += `${page.version}/`;
  }
  if (defaultLang && page.lang !== defaultLang) {
    root += `${page.lang}/`;
  }

  // The 404 page content
  return (
    <div className="rp-not-found">
      <p className="rp-not-found__error-code">404</p>
      <h1 className="rp-not-found__title">{t('notFoundText')}</h1>
      <div className="rp-not-found__divider" />

      <div className="rp-not-found__action">
        <Link
          className="rp-not-found__home-link"
          href={root}
          aria-label="go to home"
        >
          {t('takeMeHomeText')}
        </Link>
      </div>
    </div>
  );
}
