import { afterEach, describe, expect, it, rs } from '@rstest/core';
import type { ReactNode } from 'react';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { PackageManagerTabs } from './index';

rs.mock('@rspress/core/theme', () => ({
  getCustomMDXComponent: () => ({
    pre: 'pre',
  }),
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
