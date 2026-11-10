import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { FallbackHeading } from './index';

rs.mock('@rspress/core/theme', () => ({
  getCustomMDXComponent: () => ({
    a: 'a',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    h4: 'h4',
    h5: 'h5',
    h6: 'h6',
  }),
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

describe('FallbackHeading', () => {
  it('renders markdown when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <FallbackHeading level={2} title="Getting Started" />,
      ),
    ).toBe('## Getting Started\n\n');
  });
});
