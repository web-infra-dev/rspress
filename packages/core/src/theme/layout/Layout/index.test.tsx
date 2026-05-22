import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { Layout } from './index';

rs.mock('@rspress/core/runtime', () => ({
  Content: () => 'Custom content',
  useFrontmatter: () => ({
    frontmatter: {},
  }),
  useLocaleSiteData: () => ({
    description: 'Locale description',
    title: 'Locale title',
  }),
  usePage: () => ({
    page: {
      description: 'Page description',
      lang: 'en',
      pageType: 'doc',
      title: 'Guide',
    },
  }),
  useSite: () => ({
    site: {
      description: 'Site description',
      title: 'Rspress',
    },
  }),
}));

rs.mock('@rspress/core/theme', () => ({
  DocLayout: () => 'Doc layout',
  HomeLayout: () => 'Home layout',
  Nav: () => 'Nav',
  NotFoundLayout: () => 'Not found',
  useRedirect4FirstVisit: () => {
    throw new Error('client-only layout hook should not run in SSG_MD mode');
  },
  useScrollReset: () => {
    throw new Error('client-only layout hook should not run in SSG_MD mode');
  },
  useSetup: () => {
    throw new Error('client-only layout hook should not run in SSG_MD mode');
  },
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

describe('Layout', () => {
  it('renders only the page content layout when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <Layout
          afterNav="After nav"
          beforeNav="Before nav"
          bottom="Bottom"
          top="Top"
        />,
      ),
    ).toMatchInlineSnapshot('"Doc layout"');
  });
});
