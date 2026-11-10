import type React from 'react';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { NavTitle } from './index';

type Logo =
  string | { dark: string; light: string; width?: number; height?: number };

const defaultSite = {
  title: 'Rspress',
  lang: 'en',
  themeConfig: { locales: [] as { lang: string; title?: string }[] },
  logo: '/logo.svg' as Logo,
  logoText: '',
  logoHref: '',
};

let site = defaultSite;
let lang = 'en';

rs.mock('@rspress/core/runtime', () => ({
  addLeadingSlash: (path: string) => (path.startsWith('/') ? path : `/${path}`),
  addTrailingSlash: (path: string) => (path.endsWith('/') ? path : `${path}/`),
  normalizeImagePath: (path: string) => path,
  useLang: () => lang,
  useSite: () => ({ site }),
}));

rs.mock('@rspress/core/theme', () => ({
  Link: ({
    children,
    className,
    href,
  }: {
    children: React.ReactNode;
    className?: string;
    href: string;
  }) => (
    <a className={className} href={href}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  site = defaultSite;
  lang = 'en';
});

describe('NavTitle', () => {
  it('uses the site title as the logo alt and applies configured image dimensions', () => {
    site = {
      ...defaultSite,
      logo: {
        light: '/logo-light.png',
        dark: '/logo-dark.png',
        width: 120,
        height: 32,
      },
    };

    const markup = renderToStaticMarkup(<NavTitle />);

    expect(markup).toContain('alt="Rspress"');
    expect(markup.match(/id="logo"/g)).toHaveLength(1);
    expect(markup.match(/width="120"/g)).toHaveLength(2);
    expect(markup.match(/height="32"/g)).toHaveLength(2);
  });

  it('marks the logo decorative when adjacent logo text names the link', () => {
    site = { ...defaultSite, logoText: 'Rspress docs' };
    const markup = renderToStaticMarkup(<NavTitle />);

    expect(markup).toContain('alt=""');
    expect(markup).toContain('>Rspress docs</span>');
    expect(markup).not.toContain('alt="logo"');
  });
});
