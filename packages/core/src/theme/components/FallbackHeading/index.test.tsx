import { describe, expect, it, rs } from '@rstest/core';
import React from 'react';
import { renderToMarkdownString } from '../../../node/ssg-md/react/render';

// Mock @theme module
rs.mock('@theme', () => ({
  getCustomMDXComponent: () => ({
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
    a: 'a',
  }),
  renderInlineMarkdown: () => ({}),
}));

import { FallbackHeadingMarkdown } from './index';

describe('FallbackHeadingMarkdown', () => {
  it('renders h1', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={1} title="Hello World" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "# Hello World

      "
    `);
  });

  it('renders h2', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={2} title="Section Title" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "## Section Title

      "
    `);
  });

  it('renders h3', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={3} title="Subsection" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "### Subsection

      "
    `);
  });

  it('renders h4', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={4} title="Sub-subsection" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "#### Sub-subsection

      "
    `);
  });

  it('renders h5', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={5} title="Paragraph Title" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "##### Paragraph Title

      "
    `);
  });

  it('renders h6', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={6} title="Small Title" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "###### Small Title

      "
    `);
  });

  it('renders title with special characters', async () => {
    const result = await renderToMarkdownString(
      <FallbackHeadingMarkdown level={1} title="Hello `code` World" />,
    );
    expect(result).toMatchInlineSnapshot(`
      "# Hello \`code\` World

      "
    `);
  });
});
