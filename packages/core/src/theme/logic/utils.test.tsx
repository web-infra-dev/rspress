import { describe, expect, it } from '@rstest/core';

import { renderToStaticMarkup } from 'react-dom/server';
import { parseInlineMarkdownText, renderInlineMarkdown } from './utils';

describe('renderInlineMarkdown', () => {
  it.each([
    ['Class: Component\\<P, S, SS\\>', 'Class: Component&lt;P, S, SS&gt;'],
    [
      'Class: Component\\<P = \\{ \\}, S = \\{ \\}, SS = `any`\\>',
      'Class: Component&lt;P = { }, S = { }, SS = <code>any</code>&gt;',
    ],
    ['Class: Foo\\<T = \\{ \\}\\>', 'Class: Foo&lt;T = { }&gt;'],
    ['Class: Bar\\<T = `any`\\>', 'Class: Bar&lt;T = <code>any</code>&gt;'],
  ])('renders escaped generic heading %s', (text, html) => {
    expect(renderToStaticMarkup(<span {...renderInlineMarkdown(text)} />)).toBe(
      `<span>${html}</span>`,
    );
  });

  it.each([
    ['\\*literal\\* and **bold**', '*literal* and <strong>bold</strong>'],
    ['\\`literal\\` and `code`', '`literal` and <code>code</code>'],
    ['\\\\{value}', '\\{value}'],
    ['`\\{value\\}`', '<code>\\{value\\}</code>'],
    ['Class: Foo<T> \\{', 'Class: Foo&lt;T&gt; {'],
    ['Class: Foo<T> `any`', 'Class: Foo&lt;T&gt; <code>any</code>'],
    ['Class: Foo<T> &amp; `any`', 'Class: Foo&lt;T&gt; &amp; <code>any</code>'],
    ['&amp;lt;', '&amp;lt;'],
    [
      '`**literal**` and **bold**',
      '<code>**literal**</code> and <strong>bold</strong>',
    ],
    ['**`literal`**', '<strong><code>literal</code></strong>'],
    ['`&lt;`', '<code>&amp;lt;</code>'],
    ['`<b>&</b>`', '<code>&lt;b&gt;&amp;&lt;/b&gt;</code>'],
    ['``a`b``', '<code>a`b</code>'],
    ['`unclosed', '`unclosed'],
    ['`` `code` ``', '<code>`code`</code>'],
    ['` a\nb `', '<code>a b</code>'],
    ['`  `', '<code>  </code>'],
    ['<code>**literal** &amp;lt;</code>', '<code>**literal** &amp;lt;</code>'],
    ['\\&lt;', '&amp;lt;'],
    ['\\*literal\\*', '*literal*'],
    ['**bold** and \\*literal\\*', '<strong>bold</strong> and *literal*'],
    ['prefix\u00000\u0000 `code`', 'prefix\u00000\u0000 <code>code</code>'],
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
  it.each([
    ['Class: Bar\\<T = `any`\\>', 'Class: Bar<T = any>'],
    ['Class: Bar<T = `any`>', 'Class: Bar<T = any>'],
    ['Class: Foo<T> &amp; `any`', 'Class: Foo<T> & any'],
    ['\\*literal\\* and **bold**', '*literal* and bold'],
    ['`**literal**`', '**literal**'],
    ['`&lt;`', '&lt;'],
    ['``a`b``', 'a`b'],
    ['<code>**literal** &amp;lt;</code>', '**literal** &lt;'],
    ['\\&lt;', '&lt;'],
  ])('preserves literal content in %s', (input, expected) => {
    expect(parseInlineMarkdownText(input)).toBe(expected);
  });

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

  it.each([
    ['Logo <img src="/logo.svg">', 'Logo'],
    ['Logo <IMG src="/logo.svg">', 'Logo'],
    ['Before<br>After', 'BeforeAfter'],
    ['Title <input disabled><hr>', 'Title'],
    ['Class: Foo<T> <img src="/logo.svg">', 'Class: Foo<T>'],
    ['Code `<img src="/logo.svg">`', 'Code <img src="/logo.svg">'],
    ['Escaped \\<img\\>', 'Escaped <img>'],
    ['Class: Foo<img-custom>', 'Class: Foo<img-custom>'],
  ])('handles browser-serialized void elements in %s', (input, expected) => {
    expect(parseInlineMarkdownText(input)).toBe(expected);
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
