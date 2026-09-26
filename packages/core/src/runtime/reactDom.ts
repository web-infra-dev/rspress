import * as ReactDOM from 'react-dom';

type CrossOrigin = '' | 'anonymous' | 'use-credentials';

declare const browserUsable: unique symbol;

export interface BrowserUsable {
  readonly [browserUsable]: never;
}

type Browser = (reason?: string | (() => unknown)) => BrowserUsable;

type Preconnect = (
  href: string,
  options?: {
    crossOrigin?: CrossOrigin;
  },
) => void;

type Preload = (
  href: string,
  options?: {
    as:
      | 'audio'
      | 'document'
      | 'embed'
      | 'fetch'
      | 'font'
      | 'image'
      | 'object'
      | 'script'
      | 'style'
      | 'track'
      | 'video'
      | 'worker';
    crossOrigin?: CrossOrigin;
    fetchPriority?: 'high' | 'low' | 'auto';
    imageSizes?: string;
    imageSrcSet?: string;
    integrity?: string;
    media?: string;
    nonce?: string;
    referrerPolicy?: ReferrerPolicy;
    type?: string;
  },
) => void;

type ReactDOMCompat = {
  preconnect?: Preconnect;
  preload?: Preload;
  default?: ReactDOMCompat;
  browser?: Browser;
};

const reactDOM = ReactDOM as unknown as ReactDOMCompat;

export const safeBrowserOnly = reactDOM.browser ?? reactDOM.default?.browser;
export const safePreconnect =
  reactDOM.preconnect ?? reactDOM.default?.preconnect;
export const safePreload = reactDOM.preload ?? reactDOM.default?.preload;
