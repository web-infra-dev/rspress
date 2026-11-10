import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { OverviewGroup, type Group } from './index';

rs.mock('@rspress/core/runtime', () => ({
  routePathToMdPath: (routePath: string) => `${routePath}.md`,
}));

rs.mock('@rspress/core/theme', () => ({
  FallbackHeading: () => null,
  Link: 'a',
  SvgWrapper: () => null,
  renderInlineMarkdown: (text: string) => ({
    dangerouslySetInnerHTML: { __html: text },
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
  setSsgMd(originalSsgMd);
});

describe('OverviewGroup', () => {
  it('renders overview links as markdown when SSG_MD is enabled', async () => {
    setSsgMd(true);

    const group: Group = {
      name: 'Guide',
      items: [
        {
          text: 'Introduction',
          link: '/guide/introduction',
          headers: [{ id: 'install', text: 'Install', depth: 2 }],
          items: [{ text: 'Configuration', link: '/guide/configuration' }],
        },
      ],
    };

    expect(await renderToMarkdownString(<OverviewGroup group={group} />))
      .toMatchInlineSnapshot(`
      "## Guide

      ### [Introduction](/guide/introduction.md)

      - [Install](/guide/introduction.md#install)

      - [Configuration](/guide/configuration.md)
      "
    `);
  });
});
