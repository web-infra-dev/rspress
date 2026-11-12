import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { renderInlineMarkdown } from '../../logic/utils';
import { Prompt } from './index';

rs.mock('@rspress/core/runtime', () => ({
  useI18n: () => (key: string) => key,
}));

rs.mock('@rspress/core/theme', () => ({ renderInlineMarkdown }));

const originalSsgMd = import.meta.env.SSG_MD;

afterEach(() => {
  if (originalSsgMd === undefined) {
    delete (import.meta.env as unknown as Record<string, unknown>).SSG_MD;
  } else {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD =
      originalSsgMd;
  }
});

describe('Prompt Markdown rendering', () => {
  it('preserves prompt text in a code block and omits interactive controls', async () => {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
    const prompt =
      'Follow https://rspress.rs/guide/start/getting-started.md.\n\n1. Run `create rspress@latest`.\n2. Start the dev server.\n\n```sh\npnpm dev\n```';
    const markdown = await renderToMarkdownString(
      <Prompt
        title="Start a Rspress project"
        description="Send this to your **AI agent**."
        prompt={prompt}
      />,
    );
    expect(markdown).toMatchInlineSnapshot(`
      "**Start a Rspress project**

      Send this to your **AI agent**.


      \`\`\`\`
      <prompt>
      Follow https://rspress.rs/guide/start/getting-started.md.

      1. Run \`create rspress@latest\`.
      2. Start the dev server.

      \`\`\`sh
      pnpm dev
      \`\`\`
      </prompt>
      \`\`\`\`
      "
    `);
    expect(markdown).toContain(`<prompt>\n${prompt}\n</prompt>`);
    expect(markdown).toContain('Send this to your **AI agent**.');
    expect(markdown).not.toContain('promptCopyText');
    expect(markdown).not.toContain('For your Agent');
  });

  it('renders custom children as Markdown without a code block', async () => {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
    expect(
      await renderToMarkdownString(
        <Prompt custom eyebrow="Agent resources">
          <h3>Get started</h3>
          <p>
            <a href="https://rspress.rs">Read the guide</a>
          </p>
        </Prompt>,
      ),
    ).toMatchInlineSnapshot(`
      "**Agent resources**

      ### Get started

      [Read the guide](https://rspress.rs)

      "
    `);
  });

  it('uses the default title and omits absent content', async () => {
    (import.meta.env as unknown as Record<string, unknown>).SSG_MD = true;
    expect(await renderToMarkdownString(<Prompt />)).toMatchInlineSnapshot(`
      "**Agent Prompt**

      "
    `);
  });
});
