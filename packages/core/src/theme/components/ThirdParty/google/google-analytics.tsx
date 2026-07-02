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
