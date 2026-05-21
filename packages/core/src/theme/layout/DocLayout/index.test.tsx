import { afterEach, describe, expect, it, rs } from '@rstest/core';
import type { ReactNode } from 'react';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { DocLayout } from './index';

let overview = false;

rs.mock('@rspress/core/runtime', () => ({
  useFrontmatter: () => ({
    frontmatter: { overview },
  }),
}));

rs.mock('@rspress/core/theme', () => ({
  DocContent: ({ isOverviewPage }: { isOverviewPage?: boolean }) =>
    isOverviewPage ? 'Overview doc content' : 'Doc content',
  DocFooter: () => null,
  Outline: () => null,
  Overview: ({ content }: { content: ReactNode }) => (
    <>
      {'# Overview\n\n'}
      {content}
    </>
  ),
  Sidebar: () => null,
  useWatchToc: () => ({
    rspressDocRef: { current: null },
  }),
}));

rs.mock('../../components/SidebarMenu/useSidebarMenu', () => ({
  useSidebarMenu: () => ({
    asideLayoutRef: { current: null },
    isOutlineOpen: false,
    isSidebarOpen: false,
    sidebarLayoutRef: { current: null },
    sidebarMenu: null,
  }),
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
  overview = false;
  setSsgMd(originalSsgMd);
});

describe('DocLayout', () => {
  it('renders only doc content when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(await renderToMarkdownString(<DocLayout />)).toMatchInlineSnapshot(
      '"Doc content"',
    );
  });

  it('renders overview content when SSG_MD is enabled on overview pages', async () => {
    overview = true;
    setSsgMd(true);

    expect(await renderToMarkdownString(<DocLayout />)).toMatchInlineSnapshot(`
      "# Overview

      Overview doc content"
    `);
  });
});
