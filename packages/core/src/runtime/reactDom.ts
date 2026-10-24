import * as ReactDOM from 'react-dom';
import * as React from 'react';

type CrossOrigin = '' | 'anonymous' | 'use-credentials';

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
  browser?: (reason?: string) => any;
  default?: ReactDOMCompat;
};

const reactDOM = ReactDOM as unknown as ReactDOMCompat;

export const safePreconnect =
  reactDOM.preconnect ?? reactDOM.default?.preconnect;
export const safePreload = reactDOM.preload ?? reactDOM.default?.preload;

export const use = (React as any).use as <T>(promise: Promise<T> | any) => T;
export const browser = reactDOM.browser ?? reactDOM.default?.browser;
