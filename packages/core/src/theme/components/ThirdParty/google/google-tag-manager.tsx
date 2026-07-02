'use client';

import { Script } from '@rspress/core/theme';

type JSONValue =
  string | number | boolean | JSONValue[] | { [key: string]: JSONValue };

type GTMParamsBaseParams = {
  dataLayer?: { [key: string]: JSONValue };
  dataLayerName?: string;
  auth?: string;
  preview?: string;
  nonce?: string;
};

type GTMParamsWithId = GTMParamsBaseParams & {
  gtmId: string;
  gtmScriptUrl?: string;
};

type GTMParamsWithScriptUrl = GTMParamsBaseParams & {
  gtmId?: string;
  gtmScriptUrl: string;
};

export type GTMParams = GTMParamsWithId | GTMParamsWithScriptUrl;

export function GoogleTagManager(props: GTMParams) {
  const {
    gtmId,
    gtmScriptUrl,
    dataLayerName = 'dataLayer',
    auth,
    preview,
    dataLayer,
    nonce,
  } = props;

  const scriptUrl = new URL(
    gtmScriptUrl || 'https://www.googletagmanager.com/gtm.js',
  );
  if (gtmId) {
    scriptUrl.searchParams.set('id', gtmId);
  }
  if (dataLayerName !== 'dataLayer') {
    scriptUrl.searchParams.set('l', dataLayerName);
  }
  if (auth) {
    scriptUrl.searchParams.set('gtm_auth', auth);
  }
  if (preview) {
    scriptUrl.searchParams.set('gtm_preview', preview);
    scriptUrl.searchParams.set('gtm_cookies_win', 'x');
  }

  return (
    <>
      <Script
        id="_rspress-gtm-init"
        dangerouslySetInnerHTML={{
          __html: `
      (function(w,l){
        w[l]=w[l]||[];
        w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
        ${dataLayer ? `w[l].push(${JSON.stringify(dataLayer)})` : ''}
      })(window,'${dataLayerName}');`,
        }}
        nonce={nonce}
      />
      <Script id="_rspress-gtm" src={scriptUrl.href} nonce={nonce} />
    </>
  );
}
