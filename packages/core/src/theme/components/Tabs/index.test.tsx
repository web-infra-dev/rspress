import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { Tab, Tabs } from './index';

rs.mock('@rspress/core/theme', () => ({
  useStorageValue: () => ['0', () => {}],
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

describe('Tabs', () => {
  it('renders every tab as markdown when SSG_MD is enabled', async () => {
    setSsgMd(true);

    expect(
      await renderToMarkdownString(
        <Tabs>
          <Tab label="npm" value="npm">
            npm install
          </Tab>
          <Tab label="pnpm" value="pnpm">
            pnpm install
          </Tab>
        </Tabs>,
      ),
    ).toMatchInlineSnapshot(`
      "
      **npm**

      npm install

      **pnpm**

      pnpm install
      "
    `);
  });
});
