import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { LlmsHint } from './LlmsHint';

const defaultPage = {
  lang: 'en',
  routePath: '/guide/',
  version: '',
};

const defaultSite = {
  lang: 'en',
  multiVersion: {
    default: '',
    versions: [] as string[],
  },
};

let page = defaultPage;
let site = defaultSite;

rs.mock('@rspress/core/runtime', () => ({
  routePathToMdPath: (path: string) => `/docs${path}index.md`,
  usePage: () => ({ page }),
  useSite: () => ({ site }),
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
  page = defaultPage;
  site = defaultSite;
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

  it('prefixes llms file URLs with locale and version when needed', () => {
    page = {
      ...defaultPage,
      lang: 'zh',
    };
    expect(renderToStaticMarkup(<LlmsHint />)).toContain(
      'https://example.com/docs/zh/llms.txt',
    );

    site = {
      ...defaultSite,
      multiVersion: {
        default: 'v2',
        versions: ['v1', 'v2'],
      },
    };
    page = {
      ...defaultPage,
      version: 'v1',
    };
    expect(renderToStaticMarkup(<LlmsHint />)).toContain(
      'https://example.com/docs/v1/llms.txt',
    );

    page = {
      ...defaultPage,
      lang: 'zh',
      version: 'v1',
    };
    const html = renderToStaticMarkup(<LlmsHint />);
    expect(html).toContain('https://example.com/docs/v1/zh/llms.txt');
    expect(html).toContain('https://example.com/docs/v1/zh/llms-full.txt');
  });
});
