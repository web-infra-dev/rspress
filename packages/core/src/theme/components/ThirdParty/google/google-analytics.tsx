'use client';

import { Script } from '@rspress/core/theme';

declare global {
  interface Window {
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
            gtag('config', '${gaId}' ${debugMode ? ",{ 'debug_mode': true }" : ''});
          `,
        }}
        nonce={nonce}
      />
      <Script
        id="_rspress-ga"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        nonce={nonce}
      />
    </>
  );
}

export function sendGAEvent(..._args: any[]) {
  if (currDataLayerName === undefined) {
    console.warn(`Rspress Third Parties: GA has not been initialized`);
    return;
  }

  if (window[currDataLayerName]) {
    // eslint-disable-next-line prefer-rest-params
    window[currDataLayerName].push(arguments);
  } else {
    console.warn(
      `Rspress Third Parties: GA dataLayer "${currDataLayerName}" does not exist`,
    );
  }
}
