import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createContext, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { PageContext } from '@rspress/core/runtime';
import { App } from './App';

rs.mock('@rspress/core/runtime', () => ({
  PageContext: createContext({
    data: {
      frontmatter: {},
      lang: 'en',
      pagePath: '/index.md',
      pageType: 'doc',
      routePath: '/',
      title: 'Home',
      toc: [],
      version: '',
    },
    setData: () => {},
  }),
  useLocation: () => ({
    pathname: '/',
    search: '',
  }),
}));

rs.mock('@rspress/core/theme', () => ({
  Layout: () => 'Layout content',
  LlmsHint: () => 'LLMS hint',
  Root: ({ children }: { children: ReactNode }) => children,
}));

rs.mock('@rspress/core/theme-original', () => ({
  Layout: () => 'Layout content',
  LlmsHint: () => 'LLMS hint',
  Root: ({ children }: { children: ReactNode }) => children,
}));

rs.mock('virtual-global-components', () => ({
  default: [() => 'Global component'],
}));

rs.mock('./initPageData', () => ({
  consumeCachedPageData: () => undefined,
  initPageData: async () => undefined,
  setCurrentPageData: () => {},
}));

const originalSsgMd = import.meta.env.SSG_MD;
const originalEnableLlmsHint = import.meta.env.ENABLE_LLMS_HINT;

const setImportMetaEnv = (
  key: 'ENABLE_LLMS_HINT' | 'SSG_MD',
  value: boolean | undefined,
) => {
  if (value === undefined) {
    delete (import.meta.env as unknown as Record<string, unknown>)[key];
    return;
  }

  (import.meta.env as unknown as Record<string, unknown>)[key] = value;
};

afterEach(() => {
  setImportMetaEnv('SSG_MD', originalSsgMd);
  setImportMetaEnv('ENABLE_LLMS_HINT', originalEnableLlmsHint);
});

describe('App', () => {
  it('renders an LLM directive hint when ENABLE_LLMS_HINT is enabled', () => {
    setImportMetaEnv('ENABLE_LLMS_HINT', true);

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('LLMS hint');
    expect(html.indexOf('LLMS hint')).toBeLessThan(
      html.indexOf('Layout content'),
    );
  });

  it('does not render the LLM hint when it is disabled', () => {
    setImportMetaEnv('ENABLE_LLMS_HINT', undefined);

    expect(renderToStaticMarkup(<App />)).not.toContain('LLMS hint');
  });

  it('omits global UI components when SSG_MD is enabled', async () => {
    setImportMetaEnv('SSG_MD', true);

    expect(
      await renderToMarkdownString(
        <PageContext.Provider
          value={{
            data: {
              frontmatter: {},
              lang: 'en',
              pagePath: '/index.md',
              pageType: 'doc',
              routePath: '/',
              title: 'Home',
              toc: [],
              version: '',
            },
            setData: () => {},
          }}
        >
          <App />
        </PageContext.Provider>,
      ),
    ).toMatchInlineSnapshot('"Layout content"');
  });

  it('renders the LLM hint when SSG_MD and ENABLE_LLMS_HINT are enabled', async () => {
    setImportMetaEnv('SSG_MD', true);
    setImportMetaEnv('ENABLE_LLMS_HINT', true);

    expect(await renderToMarkdownString(<App />)).toMatchInlineSnapshot(
      '"LLMS hintLayout content"',
    );
  });
});
