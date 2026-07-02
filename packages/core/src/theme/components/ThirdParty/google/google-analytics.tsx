'use client';

import { Script } from '@rspress/core/theme';

declare global {
  interface Window {
    dataLayer?: Object[];
    [key: string]: any;
  }
}

export type GAParams = {
  gaId: string;
  dataLayerName?: string;
  debugMode?: boolean;
  nonce?: string;
};

let currDataLayerName: string | undefined = undefined;

export function GoogleAnalytics(props: GAParams) {
  const { gaId, debugMode, dataLayerName = 'dataLayer', nonce } = props;

  if (currDataLayerName === undefined) {
    currDataLayerName = dataLayerName;
  }

  return (
    <>
      <Script
        id="_rspress-ga-init"
        dangerouslySetInnerHTML={{
          __html: `
          window['${dataLayerName}'] = window['${dataLayerName}'] || [];
          function gtag(){window['${dataLayerName}'].push(arguments);}
          gtag('js', new Date());

          gtag('config', '${gaId}' ${debugMode ? ",{ 'debug_mode': true }" : ''});`,
        }}
        nonce={nonce}
      />
      <Script
        id="_next-ga"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        nonce={nonce}
      />
    </>
  );
}
export function sendGAEvent(...args: any[]) {
  if (typeof window === 'undefined') {
    return;
  }

  if (currDataLayerName === undefined) {
    console.warn(
      `[Rspress] GA has not been initialized. Please render the GoogleAnalytics component first.`,
    );
    return;
  }

  const dataLayer = (window as any)[currDataLayerName];

  if (dataLayer && typeof dataLayer.push === 'function') {
    dataLayer.push(...args);
  } else {
    console.warn(
      `[Rspress] GA dataLayer "${currDataLayerName}" does not exist on the window object.`,
    );
  }
}
