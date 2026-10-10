import { useHead } from '@unhead/react';
import { useEffect, useRef } from 'react';
import { isRouteErrorResponse } from 'react-router-dom';
import { useI18nText } from '../../../runtime/hooks/useI18nText';
import '../NotFountLayout/index.scss';
import './index.scss';

export interface ErrorLayoutProps {
  error: unknown;
  lang: string;
  homeHref: string;
}

export function ErrorLayout({ error, lang, homeHref }: ErrorLayoutProps) {
  const i18n = useI18nText();
  const title = useRef<HTMLHeadingElement>(null);
  const text = (key: string, fallback: string) => i18n[key]?.[lang] || fallback;
  const heading = text('errorTitleText', 'Something went wrong');
  useHead({ title: heading });
  const response = isRouteErrorResponse(error);
  const details = import.meta.env.DEV
    ? error instanceof Error
      ? error.stack || error.message
      : response
        ? `${error.status} ${error.statusText}`
        : typeof error === 'string'
          ? error
          : 'Unknown error'
    : undefined;

  useEffect(() => {
    title.current?.focus();
  }, [heading]);

  return (
    <main className="rp-not-found rp-error" aria-labelledby="rp-error-title">
      <p className="rp-not-found__error-code">
        {response ? error.status : 'ERROR'}
      </p>
      <h1
        className="rp-not-found__title"
        id="rp-error-title"
        ref={title}
        tabIndex={-1}
      >
        {heading}
      </h1>
      <div className="rp-not-found__divider" />
      <p className="rp-error__description">
        {text(
          'errorDescriptionText',
          'This page could not be loaded. Try reloading it or return to the home page.',
        )}
      </p>
      <div className="rp-not-found__action rp-error__actions">
        <button
          type="button"
          className="rp-not-found__home-link"
          onClick={() => window.location.reload()}
        >
          {text('reloadPageText', 'Reload page')}
        </button>
        <a className="rp-not-found__home-link" href={homeHref}>
          {text('takeMeHomeText', 'Take me home')}
        </a>
      </div>
      {details && (
        <details className="rp-error__details" open>
          <summary>{text('errorDetailsText', 'Error details')}</summary>
          <pre>{details}</pre>
        </details>
      )}
    </main>
  );
}
