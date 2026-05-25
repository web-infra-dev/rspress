import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { createContext, type ReactNode } from 'react';
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

rs.mock('@theme', () => ({
  Layout: () => 'Layout content',
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

describe('App', () => {
  it('omits global UI components when SSG_MD is enabled', async () => {
    setSsgMd(true);

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
});
