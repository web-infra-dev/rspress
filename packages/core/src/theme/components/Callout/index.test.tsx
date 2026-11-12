import { afterEach, describe, expect, it } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { Callout } from './index';

const originalSsgMd = import.meta.env.SSG_MD;
afterEach(() => {
  (import.meta.env as unknown as Record<string, unknown>).SSG_MD =
    originalSsgMd;
});

describe('Callout Markdown rendering', () => {
  it('keeps the title and multiple paragraphs inside a quote', async () => {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
    const markdown = await renderToMarkdownString(
      <Callout type="warning" title="Before you begin">
        <p>Install dependencies.</p>
        <p>
          Then run <code>pnpm dev</code>.
        </p>
      </Callout>,
    );
    expect(
      markdown
        .replace(/^> ?$/gm, '>')
        .trim()
        .replace(/(?:\n>)+$/, '')
        .trim(),
    ).toBe(
      '> **Before you begin**\n>\n> Install dependencies.\n>\n> Then run `pnpm dev`.',
    );
  });

  it('exports all details content with the default title', async () => {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
    const markdown = await renderToMarkdownString(
      <Callout type="details">
        <p>Hidden in the browser.</p>
      </Callout>,
    );
    expect(
      markdown
        .replace(/^> ?$/gm, '>')
        .trim()
        .replace(/(?:\n>)+$/, '')
        .trim(),
    ).toBe('> **Details**\n>\n> Hidden in the browser.');
  });
});
