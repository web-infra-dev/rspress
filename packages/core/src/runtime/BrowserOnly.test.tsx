import { PassThrough } from 'node:stream';
import { text } from 'node:stream/consumers';
import { describe, expect, it, rs } from '@rstest/core';
import { createElement, type ReactNode } from 'react';
import { renderToPipeableStream, renderToString } from 'react-dom/server';
import { BrowserOnly, type BrowserOnlyProps } from './BrowserOnly';
import { NoSSR } from './NoSSR';

function renderToHtml(app: ReactNode): Promise<string> {
  return new Promise((resolve, reject) => {
    const output = new PassThrough();
    const { pipe } = renderToPipeableStream(app, {
      onError: reject,
      onAllReady() {
        pipe(output);
        text(output).then(resolve, reject);
      },
    });
  });
}

describe('BrowserOnly', () => {
  it('renders fallback without reporting an SSR error', async () => {
    const browserOnlyProps: BrowserOnlyProps = {
      fallback: createElement('div', null, 'Loading...'),
      children: () => createElement('div', null, 'Browser content'),
    };

    const html = await renderToHtml(
      createElement(BrowserOnly, browserOnlyProps),
    );

    expect(html).toContain('<div>Loading...</div>');
    expect(html).not.toContain('Browser content');
  });

  it('does not call children during SSR', () => {
    let called = false;
    const browserOnlyProps: BrowserOnlyProps = {
      children: () => {
        called = true;
        return createElement('div', null, 'Browser content');
      },
    };

    renderToString(createElement(BrowserOnly, browserOnlyProps));

    expect(called).toBe(false);
  });

  it('does not render NoSSR children during SSR', async () => {
    const Content = rs.fn(() => <div>Browser content</div>);
    const html = await renderToHtml(
      <NoSSR>
        <Content />
      </NoSSR>,
    );

    expect(html).not.toContain('Browser content');
    expect(Content).not.toHaveBeenCalled();
  });
});
