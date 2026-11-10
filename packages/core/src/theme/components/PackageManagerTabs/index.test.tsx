import { afterEach, describe, expect, it, rs } from '@rstest/core';
import type { ReactNode } from 'react';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { PackageManagerTabs, type PackageManagerTabProps } from './index';

rs.mock('@rspress/core/theme', () => ({
  getCustomMDXComponent: () => ({
    pre: 'pre',
  }),
  IconBun: 'bun',
  IconDeno: 'deno',
  IconNpm: 'npm',
  IconPnpm: 'pnpm',
  IconYarn: 'yarn',
  SvgWrapper: () => null,
  Tab: ({ children }: { children: ReactNode }) => children,
  Tabs: ({ children }: { children: ReactNode }) => children,
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

describe('PackageManagerTabs', () => {
  it.each<PackageManagerTabProps>([
    { command: 'install -D @rspress/core' },
    { command: 'rspress --help', exec: true },
    { command: 'rspress --help', dlx: true },
  ])('renders an additional tab command as written with %j', async props => {
    setSsgMd(true);

    const markdown = await renderToMarkdownString(
      <PackageManagerTabs
        {...props}
        additionalTabs={[
          { tool: 'custom', command: 'corepack pnpm add --dev @rspress/core' },
        ]}
      />,
    );

    expect(markdown).toContain(
      '```sh [corepack]\ncorepack pnpm add --dev @rspress/core\n```',
    );
    expect(markdown).not.toContain('custom ');
  });

  it('keeps generating commands for additional tabs without an explicit command', async () => {
    setSsgMd(true);

    const markdown = await renderToMarkdownString(
      <PackageManagerTabs
        command="install -D @rspress/core"
        additionalTabs={[{ tool: 'custom' }]}
      />,
    );

    expect(markdown).toContain(
      '```sh [custom]\ncustom install -D @rspress/core\n```',
    );
    expect(markdown).toContain('```sh [yarn]\nyarn add -D @rspress/core\n```');
  });

  it('adds commands to an object command without mutating it', async () => {
    setSsgMd(true);
    const command = Object.freeze({ npm: 'npm install @rspress/core' });

    const markdown = await renderToMarkdownString(
      <PackageManagerTabs
        command={command}
        additionalTabs={[
          { tool: 'custom', command: 'custom add @rspress/core' },
          { tool: 'unused' },
        ]}
      />,
    );

    expect(markdown).toContain('```sh [npm]\nnpm install @rspress/core\n```');
    expect(markdown).toContain('```sh [custom]\ncustom add @rspress/core\n```');
    expect(markdown).not.toContain('unused');
    expect(command).toEqual({ npm: 'npm install @rspress/core' });
  });

  it('does not normalize an explicit command for a built-in tool', async () => {
    setSsgMd(true);

    const markdown = await renderToMarkdownString(
      <PackageManagerTabs
        command="install -D @rspress/core"
        additionalTabs={[{ tool: 'yarn', command: 'yarn install --immutable' }]}
      />,
    );

    expect(markdown).toContain('```sh [yarn]\nyarn install --immutable\n```');
    expect(markdown).not.toContain('yarn add');
  });

  it('renders install commands as markdown code fences when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <PackageManagerTabs
          command={{
            npm: 'npm install rspress',
            pnpm: 'pnpm add rspress',
          }}
        />,
      ),
    ).toMatchInlineSnapshot(`
      "
      \`\`\`sh [npm]
      npm install rspress
      \`\`\`

      \`\`\`sh [pnpm]
      pnpm add rspress
      \`\`\`
      "
    `);
  });
});
