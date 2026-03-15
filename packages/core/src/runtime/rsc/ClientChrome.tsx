'use client';

import siteData from 'virtual-site-data';
import { ThemeContext } from '../hooks/useDark';
import { useFrontmatter } from '../hooks/useFrontmatter';
import { usePage } from '../hooks/usePage';
import { withBase } from '../utils';
import { useContext } from 'react';

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
        <RscAppearanceToggle />
      </div>
    </header>
  );
}

export function RscDocChrome({
  content,
  overviewContent,
}: {
  content: React.ReactNode;
  overviewContent: React.ReactNode;
}) {
  const { frontmatter } = useFrontmatter();
  const isOverviewPage = frontmatter?.overview ?? false;
  const pageType = frontmatter?.pageType;
  const isDocWide = pageType === 'doc-wide';

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

export function RscOverviewChrome({ content }: { content: React.ReactNode }) {
  return <div className="rp-overview">{content}</div>;
}

export function RscNotFoundChrome() {
  const { page } = usePage();
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

function RscAppearanceToggle() {
  const { theme, setTheme = () => {} } = useContext(ThemeContext);
  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      className="rp-switch-appearance"
      onClick={() => setTheme(nextTheme)}
      aria-label="toggle appearance"
    >
      {nextTheme}
    </button>
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
