import { describe, expect, it } from '@rstest/core';

import { renderToStaticMarkup } from 'react-dom/server';
import { parseInlineMarkdownText, renderInlineMarkdown } from './utils';

describe('renderInlineMarkdown', () => {
  it.each([
    ['Class: Component\\<P, S, SS\\>', 'Class: Component&#60;P, S, SS&#62;'],
    [
      'Class: Component\\<P = \\{ \\}, S = \\{ \\}, SS = `any`\\>',
      'Class: Component&#60;P = &#123; &#125;, S = &#123; &#125;, SS = <code>any</code>&#62;',
    ],
    ['Class: Foo\\<T = \\{ \\}\\>', 'Class: Foo&#60;T = &#123; &#125;&#62;'],
    ['Class: Bar\\<T = `any`\\>', 'Class: Bar&#60;T = <code>any</code>&#62;'],
  ])('renders escaped generic heading %s', (text, html) => {
    expect(renderToStaticMarkup(<span {...renderInlineMarkdown(text)} />)).toBe(
      `<span>${html}</span>`,
    );
  });

  it.each([
    [
      '\\*literal\\* and **bold**',
      '&#42;literal&#42; and <strong>bold</strong>',
    ],
    ['\\`literal\\` and `code`', '&#96;literal&#96; and <code>code</code>'],
    ['\\\\{value}', '&#92;{value}'],
    ['`\\{value\\}`', '<code>\\{value\\}</code>'],
    [
      '<strong>HTML</strong> and *emphasis*',
      '<strong>HTML</strong> and <em>emphasis</em>',
    ],
  ])('preserves inline formatting and literal escapes in %s', (text, html) => {
    expect(renderToStaticMarkup(<span {...renderInlineMarkdown(text)} />)).toBe(
      `<span>${html}</span>`,
    );
  });
});

describe('parseInlineMarkdownText', () => {
  it('strips the inline markdown syntax', () => {
    expect(parseInlineMarkdownText('this is bold **rsbuild**')).toBe(
      'this is bold rsbuild',
    );
    expect(parseInlineMarkdownText('this is emphasis *rsbuild*')).toBe(
      'this is emphasis rsbuild',
    );
    expect(parseInlineMarkdownText('this is delete ~~rsbuild~~')).toBe(
      'this is delete rsbuild',
    );
    expect(parseInlineMarkdownText('this is code `rsbuild`')).toBe(
      'this is code rsbuild',
    );
  });

  it('keeps the HTML written in inline code', () => {
    expect(parseInlineMarkdownText('this is component `<Badge />`')).toBe(
      'this is component <Badge />',
    );
  });

  // The headers collected by `useDynamicToc` carry the innerHTML of the heading, so the markup of the components
  // rendered in the heading, a badge for example, must not end up in the toc item tooltip.
  it('strips the HTML collected from the DOM', () => {
    expect(
      parseInlineMarkdownText(
        'this is badge <span class="rp-badge">2.0.19</span>',
      ),
    ).toBe('this is badge 2.0.19');
    expect(parseInlineMarkdownText('this is code <code>rsbuild</code>')).toBe(
      'this is code rsbuild',
    );
    expect(
      parseInlineMarkdownText('this is image <img src="/badge.png" alt="" />'),
    ).toBe('this is image');
  });

  it('decodes the HTML entities collected from the DOM', () => {
    expect(parseInlineMarkdownText('dynamic &amp; content')).toBe(
      'dynamic & content',
    );
    expect(parseInlineMarkdownText('this is generic &lt;T&gt;')).toBe(
      'this is generic <T>',
    );
    expect(parseInlineMarkdownText('this&nbsp;is&nbsp;nbsp')).toBe(
      'this\u00A0is\u00A0nbsp',
    );
    expect(parseInlineMarkdownText('this is &#39;quoted&#39;')).toBe(
      "this is 'quoted'",
    );
    expect(parseInlineMarkdownText('this is &#x27;quoted&#x27;')).toBe(
      "this is 'quoted'",
    );
  });

  it('does not decode an escaped HTML entity twice', () => {
    expect(parseInlineMarkdownText('&amp;lt;')).toBe('&lt;');
  });

  it('keeps a numeric entity which is not a Unicode scalar value', () => {
    // Out of the Unicode range, `String.fromCodePoint` would throw
    expect(parseInlineMarkdownText('out of range &#x110000;')).toBe(
      'out of range &#x110000;',
    );
    expect(parseInlineMarkdownText('out of range &#1114112;')).toBe(
      'out of range &#1114112;',
    );
    // Lone surrogates, `String.fromCodePoint` would return an ill-formed string
    expect(parseInlineMarkdownText('lone surrogate &#xD800;')).toBe(
      'lone surrogate &#xD800;',
    );
    expect(parseInlineMarkdownText('lone surrogate &#57343;')).toBe(
      'lone surrogate &#57343;',
    );
    // Astral characters are still decoded
    expect(parseInlineMarkdownText('astral &#x1F600;')).toBe(
      'astral \u{1F600}',
    );
  });
});
