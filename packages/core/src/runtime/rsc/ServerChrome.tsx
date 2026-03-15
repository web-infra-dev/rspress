import type { PageDataLegacy } from '@rspress/shared';
import type { ReactNode } from 'react';
import siteData from 'virtual-site-data';
import { withBase } from '../utils';

export function RscNavChrome() {
  const title = siteData.title || siteData.logoText || 'Rspress';

  return (
    <header className="rp-nav">
      <div className="rp-nav__left">
        <a className="rp-nav-title" href={withBase('/')}>
          {title}
        </a>
      </div>
      <div className="rp-nav__right">
        <button
          type="button"
          className="rp-switch-appearance"
          data-rspress-theme-toggle
          aria-label="toggle appearance"
        >
          dark
        </button>
      </div>
    </header>
  );
}

export function RscDocChrome({
  content,
  overviewContent,
  isOverviewPage,
  isDocWide,
}: {
  content: ReactNode;
  overviewContent: ReactNode;
  isOverviewPage: boolean;
  isDocWide: boolean;
}) {
  return (
    <div className="rp-doc-layout__container">
      {isOverviewPage ? (
        <main className="rp-doc-layout__overview">{overviewContent}</main>
      ) : (
        <div className={`rp-doc-layout__doc ${isDocWide ? 'rp-doc-layout__doc--wide' : ''}`}>
          <main className="rp-doc-layout__doc-container">
            <div className="rp-doc rspress-doc">{content}</div>
          </main>
        </div>
      )}
    </div>
  );
}

export function RscOverviewChrome({ content }: { content: ReactNode }) {
  return <div className="rp-overview">{content}</div>;
}

export function RscNotFoundChrome({
  page,
}: {
  page: PageDataLegacy['page'];
}) {
  const root = getRootPath(page.lang || '', page.version || '');

  return (
    <div className="rp-not-found">
      <p className="rp-not-found__error-code">404</p>
      <h1 className="rp-not-found__title">404</h1>
      <div className="rp-not-found__divider" />
      <div className="rp-not-found__action">
        <a className="rp-not-found__home-link" href={root} aria-label="go to home">
          Home
        </a>
      </div>
    </div>
  );
}

function getRootPath(lang: string, version: string) {
  const segments = [''];

  if (version) {
    segments.push(version);
  }
  if (lang) {
    segments.push(lang);
  }

  return `${segments.join('/')}/`.replace(/\/+/g, '/');
}
