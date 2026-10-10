import { ErrorLayout } from '@rspress/core/theme';
import { useEffect } from 'react';
import { useLocation, useRouteError } from 'react-router-dom';
import { useSite } from './hooks/useSite';
import { withBase } from './utils';

export function ErrorRoute() {
  const error = useRouteError();
  const { pathname } = useLocation();
  const { site } = useSite();
  // PageContext may not exist when the loader or the layout fails.
  const segments = pathname.split('/').filter(Boolean);
  const version = site.multiVersion.versions.find(v => v === segments[0]);
  const lang =
    site.locales.find(locale => locale.lang === segments[version ? 1 : 0])
      ?.lang || site.lang;
  const prefix = [
    version !== site.multiVersion.default ? version : undefined,
    lang !== site.lang ? lang : undefined,
  ].filter(Boolean);
  const homeHref = withBase(prefix.length ? `/${prefix.join('/')}/` : '/');

  useEffect(() => {
    console.error('[rspress] Failed to render page:', error);
  }, [error]);

  return <ErrorLayout error={error} lang={lang} homeHref={homeHref} />;
}
