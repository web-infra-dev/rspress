import { afterEach, describe, expect, it, rs } from '@rstest/core';
import type { ReactNode } from 'react';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { CdnTabs } from './index';

rs.mock('@rspress/core/theme', () => ({
  getCustomMDXComponent: () => ({
    pre: 'pre',
  }),
  Tab: ({ children }: { children: ReactNode }) => children,
  Tabs: ({ children }: { children: ReactNode }) => children,
}));

const originalSsgMd = import.meta.env.SSG_MD;

const setSsgMd = (value: boolean | undefined) => {
  if (value === undefined) {
    delete (import.meta.env as unknown as Record<string, unknown>).SSG_MD;
    return;
  }

  (import.meta.env as unknown as Record<string, unknown>).SSG_MD = value;
};

afterEach(() => {
  setSsgMd(originalSsgMd);
});

describe('CdnTabs', () => {
  it('renders CSS and JavaScript tags for the default CDNs in SSG markdown', async () => {
    setSsgMd(true);

    const markdown = await renderToMarkdownString(
      <CdnTabs
        package="bootstrap@5"
        files={['dist/css/bootstrap.min.css', 'dist/js/bootstrap.min.js']}
      />,
    );

    expect(markdown).toContain('```html [jsDelivr]');
    expect(markdown).toContain(
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5/dist/css/bootstrap.min.css" />',
    );
    expect(markdown).toContain(
      '<script src="https://unpkg.com/bootstrap@5/dist/js/bootstrap.min.js"></script>',
    );
    expect(markdown).toContain('```html [unpkg]');
  });

  it('supports scoped packages and a custom CDN order', async () => {
    setSsgMd(true);

    const markdown = await renderToMarkdownString(
      <CdnTabs
        package="@scope/package@5"
        files={['dist/bundle.js']}
        cdns={['unpkg', 'jsdelivr']}
      />,
    );

    expect(markdown.indexOf('```html [unpkg]')).toBeLessThan(
      markdown.indexOf('```html [jsDelivr]'),
    );
    expect(markdown).toContain(
      '<script src="https://unpkg.com/@scope/package@5/dist/bundle.js"></script>',
    );
    expect(markdown).toContain(
      '<script src="https://cdn.jsdelivr.net/npm/@scope/package@5/dist/bundle.js"></script>',
    );
  });
});
