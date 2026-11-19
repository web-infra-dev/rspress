import { setImmediate } from 'node:timers/promises';
import { afterEach, describe, expect, it, rs } from '@rstest/core';
import { Component, type ReactNode } from 'react';
import { renderToMarkdownString } from 'react-render-to-markdown';
import { useStorageValue } from '../../logic/useStorageValue';
import { Tab, Tabs } from './index';

rs.mock('@rspress/core/theme', () => ({ useStorageValue }));

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
    expect(typeof window).toBe('undefined');

    const errors: Error[] = [];
    class ErrorBoundary extends Component<{ children: ReactNode }> {
      state = { hasError: false };

      static getDerivedStateFromError() {
        return { hasError: true };
      }

      componentDidCatch(error: Error) {
        errors.push(error);
      }

      render() {
        return this.state.hasError ? null : this.props.children;
      }
    }

    const markdown = await renderToMarkdownString(
      <ErrorBoundary>
        <Tabs>
          <Tab label="npm" value="npm">
            npm install
          </Tab>
          <Tab label="pnpm" value="pnpm">
            pnpm install
          </Tab>
        </Tabs>
      </ErrorBoundary>,
    );
    // Storage subscriptions run after the Markdown renderer resolves its commit.
    await setImmediate();
    expect(errors).toEqual([]);
    expect(markdown).toMatchInlineSnapshot(`
      "**npm**

      npm install

      **pnpm**

      pnpm install"
    `);
  });
  it('renders React labels and omits missing labels', async () => {
    setSsgMd(true);
    const markdown = await renderToMarkdownString(
      <Tabs>
        <Tab
          label={
            <span>
              GitHub <code>repo</code>
            </span>
          }
        >
          Repository settings
        </Tab>
        <Tab>Unlabelled content</Tab>
      </Tabs>,
    );
    expect(markdown).toMatchInlineSnapshot(`
      "**GitHub \`repo\`**

      Repository settings

      Unlabelled content"
    `);
  });
});
