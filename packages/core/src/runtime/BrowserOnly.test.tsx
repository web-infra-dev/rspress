import { describe, expect, it } from '@rstest/core';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BrowserOnly, type BrowserOnlyProps } from './BrowserOnly';
import { NoSSR } from './NoSSR';

describe('BrowserOnly', () => {
  it('renders fallback during SSR', () => {
    const browserOnlyProps: BrowserOnlyProps = {
      fallback: createElement('div', null, 'Loading...'),
      children: () => createElement('div', null, 'Browser content'),
    };

    const html = renderToString(createElement(BrowserOnly, browserOnlyProps));

    expect(html).toBe('<div>Loading...</div>');
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

  it('keeps NoSSR empty during SSR', () => {
    const html = renderToString(
      createElement(NoSSR, null, createElement('div', null, 'Browser content')),
    );

    expect(html).toBe('');
  });
});
