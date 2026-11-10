import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { Overview } from './index';

rs.mock('@rspress/core/runtime', () => ({
  isEqualPath: (a: string, b: string) => a === b,
  useI18n: () => (key: string) => key,
  usePageData: () => ({
    page: {
      frontmatter: { overview: true },
      routePath: '/guide/overview',
      title: 'Guide Overview',
    },
    siteData: { pages: [] },
  }),
  useSidebar: () => [{ link: '/guide/overview', text: 'Overview' }],
}));

rs.mock('@rspress/core/theme', () => ({
  FallbackHeading: ({ level, title }: { level: number; title: string }) =>
    `${'#'.repeat(level)} ${title}\n\n`,
  OverviewGroup: ({ group }: { group: { name: string } }) =>
    `## ${group.name}\n\n`,
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

describe('Overview', () => {
  it('renders heading and groups as markdown when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <Overview groups={[{ name: 'Guides', items: [] }]} />,
      ),
    ).toMatchInlineSnapshot(`
      "# Guide Overview

      ## Guides

      "
    `);
  });
});
