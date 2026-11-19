import { afterEach, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { PageTab, PageTabs } from './index';

rs.mock('@rspress/core/runtime', () => ({
  useSearchParams: () => [new URLSearchParams(), () => {}],
  useLocation: () => ({ search: '' }),
}));

const originalSsgMd = import.meta.env.SSG_MD;
afterEach(() => {
  (import.meta.env as unknown as Record<string, unknown>).SSG_MD =
    originalSsgMd;
});

it('places each page label next to its content in Markdown', async () => {
  (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
  const markdown = await renderToMarkdownString(
    <PageTabs>
      <PageTab
        label={
          <span>
            API <code>v2</code>
          </span>
        }
      >
        <p>API content</p>
      </PageTab>
      <PageTab label="How it works">
        <p>Implementation content</p>
      </PageTab>
    </PageTabs>,
  );
  expect(markdown).toMatchInlineSnapshot(`
    "**API \`v2\`**

    API content

    **How it works**

    Implementation content

    "
  `);
});
