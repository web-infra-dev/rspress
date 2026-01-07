import { describe, expect, it, rs } from '@rstest/core';
import React from 'react';
import { renderToMarkdownString } from '../../../node/ssg-md/react/render';
import { OverviewGroup } from './index';

// Mock virtual-site-data for @rspress/core/runtime
rs.mock('virtual-site-data', () => ({
  default: {
    base: '/',
  },
}));

// Mock @theme module
rs.mock('@theme', () => ({
  Link: () => null,
  renderInlineMarkdown: () => ({}),
  FallbackHeading: () => null,
  SvgWrapper: () => null,
}));

// Mock scss import
rs.mock('./index.scss', () => ({}));

// Mock svg import
rs.mock('./icons/plugin.svg', () => 'mock-svg');

import type { Group } from './index';
import { OverviewGroupMarkdown } from './index';

describe('OverviewGroupMarkdown', () => {
  it.only('renders group with name and items with headers', async () => {
    const group: Group = {
      name: 'Getting Started',
      items: [
        {
          text: 'Introduction',
          link: '/guide/introduction',
          headers: [
            { id: 'what-is-rspress', text: 'What is Rspress', depth: 2 },
            { id: 'features', text: 'Features', depth: 2 },
          ],
        },
        {
          text: 'Quick Start',
          link: '/guide/quick-start',
          headers: [
            { id: 'installation', text: 'Installation', depth: 2 },
            { id: 'configuration', text: 'Configuration', depth: 2 },
          ],
        },
      ],
    };

    const result = await renderToMarkdownString(
      <OverviewGroup group={group} />,
    );
    expect(result).toMatchInlineSnapshot(`
      "## Getting Started

      ### [Introduction](/guide/introduction.md)

      - [What is Rspress](/guide/introduction.md#what-is-rspress)
      - [Features](/guide/introduction.md#features)

      ### [Quick Start](/guide/quick-start.md)

      - [Installation](/guide/quick-start.md#installation)
      - [Configuration](/guide/quick-start.md#configuration)
      "
    `);
  });

  it('renders group without name', async () => {
    const group: Group = {
      name: '',
      items: [
        {
          text: 'Home',
          link: '/home',
        },
      ],
    };

    const result = await renderToMarkdownString(
      <OverviewGroupMarkdown group={group} />,
    );
    expect(result).toMatchInlineSnapshot(`
      "### [Home](/home.md)
      "
    `);
  });

  it('renders group with custom items', async () => {
    const group: Group = {
      name: 'API Reference',
      items: [
        {
          text: 'Config',
          link: '/api/config',
          items: [
            { text: 'Basic Config', link: '/api/config/basic' },
            { text: 'Theme Config', link: '/api/config/theme' },
          ],
        },
      ],
    };

    const result = await renderToMarkdownString(
      <OverviewGroupMarkdown group={group} />,
    );
    expect(result).toMatchInlineSnapshot(`
      "## API Reference

      ### [Config](/api/config.md)

      - [Basic Config](/api/config/basic.md)
      - [Theme Config](/api/config/theme.md)
      "
    `);
  });

  it('renders item without link as bold text', async () => {
    const group: Group = {
      name: 'Section',
      items: [
        {
          text: 'No Link Item',
          link: '',
          headers: [{ id: 'header-1', text: 'Header 1', depth: 2 }],
        },
      ],
    };

    const result = await renderToMarkdownString(
      <OverviewGroupMarkdown group={group} />,
    );
    expect(result).toMatchInlineSnapshot(`
      "## Section

      ### **No Link Item**

      - Header 1
      "
    `);
  });

  it('renders mixed items with headers and custom items', async () => {
    const group: Group = {
      name: 'Guide',
      items: [
        {
          text: 'Basics',
          link: '/guide/basics',
          headers: [{ id: 'intro', text: 'Introduction', depth: 2 }],
          items: [{ text: 'Sub Page', link: '/guide/basics/sub' }],
        },
      ],
    };

    const result = await renderToMarkdownString(
      <OverviewGroupMarkdown group={group} />,
    );
    expect(result).toMatchInlineSnapshot(`
      "## Guide

      ### [Basics](/guide/basics.md)

      - [Introduction](/guide/basics.md#intro)

      - [Sub Page](/guide/basics/sub.md)
      "
    `);
  });
});
