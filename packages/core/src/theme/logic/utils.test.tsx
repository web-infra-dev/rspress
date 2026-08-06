import { describe, expect, it } from '@rstest/core';

import { parseInlineMarkdownText } from './utils';

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
});
