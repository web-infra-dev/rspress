import type { ReactNode } from 'react';
import { createElement } from 'react';
import { BrowserOnly, type BrowserOnlyProps } from './BrowserOnly';

export function NoSSR(props: { children: ReactNode }) {
  const { children } = props;
  const browserOnlyProps: BrowserOnlyProps = {
    children: () => children,
  };

  return createElement(BrowserOnly, browserOnlyProps);
}
