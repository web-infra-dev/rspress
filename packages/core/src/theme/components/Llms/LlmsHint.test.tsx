import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { LlmsHint } from './LlmsHint';

rs.mock('@rspress/core/runtime', () => ({
  routePathToMdPath: (path: string) => `/docs${path}index.md`,
  usePage: () => ({
    page: {
      lang: 'en',
      routePath: '/guide/',
      version: '',
    },
  }),
  useSite: () => ({
    site: {
      lang: 'en',
      multiVersion: {
        default: '',
        versions: [],
      },
    },
  }),
  withBase: (path: string) => `/docs${path}`,
  withSiteOrigin: (path: string) => `https://example.com${path}`,
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

describe('LlmsHint', () => {
  it('renders a visually hidden plain-text directive in HTML', () => {
    const html = renderToStaticMarkup(<LlmsHint />);

    expect(html).toContain('data-rspress-llms-hint="true"');
    expect(html).toMatch(/clip:rect\(0, ?0, ?0, ?0\)/);
    expect(html).not.toContain('display:none');
    expect(html).not.toContain('hidden=""');
    expect(html).not.toContain('aria-hidden="true"');
    expect(html).not.toContain('<a ');
    expect(html).toContain(
      'For AI agents: the complete documentation index is available at https://example.com/docs/llms.txt, the full documentation bundle is available at https://example.com/docs/llms-full.txt, and this page is available as Markdown at https://example.com/docs/guide/index.md.',
    );
  });

  it('renders a blockquote string when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(await renderToMarkdownString(<LlmsHint />)).toBe(
      '> For AI agents: the complete documentation index is available at https://example.com/docs/llms.txt, the full documentation bundle is available at https://example.com/docs/llms-full.txt, and this page is available as Markdown at https://example.com/docs/guide/index.md.\n\n',
    );
  });
});
