import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { CodeBlock } from './index';

rs.mock('@rspress/core/theme', () => ({
  CodeButtonGroup: () => null,
  IconArrowDown: () => null,
  SvgWrapper: () => null,
  useCodeButtonGroup: () => ({
    copyElementRef: { current: null },
    toggleWrapCode: () => {},
    wrapCode: false,
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

describe('CodeBlock', () => {
  it('renders only its children when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <CodeBlock title="example.ts">
          <pre>const value = true;</pre>
        </CodeBlock>,
      ),
    ).toMatchInlineSnapshot(`
      "
      \`\`\`\`
      const value = true;
      \`\`\`\`
      "
    `);
  });
});
