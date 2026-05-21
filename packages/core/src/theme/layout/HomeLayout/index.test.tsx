import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { HomeLayout } from './index';

rs.mock('@rspress/core/runtime', () => ({
  useFrontmatter: () => ({
    frontmatter: {
      hero: {
        name: 'Rspress',
        text: 'Static site generation made simple.',
        tagline: 'Build fast documentation sites.',
        actions: [{ text: 'Get Started', link: '/guide/start' }],
      },
      features: [
        {
          title: 'Fast',
          details: 'Powered by Rspack.',
        },
        {
          title: 'Extensible',
          details: 'Use plugins and custom themes.',
          link: '/plugin',
        },
      ],
    },
  }),
}));

rs.mock('@rspress/core/theme', () => ({
  HomeBackground: () => null,
  HomeFeature: () => null,
  HomeFooter: () => null,
  HomeHero: () => null,
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

describe('HomeLayout', () => {
  it('renders frontmatter hero and features as markdown when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(await renderToMarkdownString(<HomeLayout />)).toMatchInlineSnapshot(`
      "# Rspress

      Static site generation made simple.

      > Build fast documentation sites.

      [Get Started](/guide/start)

      ## Features

      - **Fast**: Powered by Rspack.
      - [**Extensible**](/plugin): Use plugins and custom themes.
      "
    `);
  });
});
