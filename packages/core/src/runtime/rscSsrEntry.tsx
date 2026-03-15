import React from 'react';
import { renderToReadableStream } from 'react-dom/server.edge';
import { prerender } from 'react-dom/static.edge';
import { createFromReadableStream } from 'react-server-dom-rspack/client.edge';
import { injectRSCPayload } from 'rsc-html-stream/server';
import type { RscPayload } from './rsc/shared';
import * as clientReferences from './rscClientReferences';
export {
  RscClientProviders,
  RscDocChrome,
  RscNavChrome,
  RscNotFoundChrome,
  RscOverviewChrome,
} from './rscClientReferences';

if (typeof globalThis !== 'undefined') {
  (
    globalThis as typeof globalThis & {
      __RSPRESS_RSC_SSR_CLIENT_REFERENCES__?: typeof clientReferences;
    }
  ).__RSPRESS_RSC_SSR_CLIENT_REFERENCES__ = clientReferences;
}
export async function renderHtml(
  rscStream: ReadableStream<Uint8Array>,
  options?: {
    bootstrapScripts?: string[];
    ssg?: boolean;
  },
): Promise<{ stream: ReadableStream<Uint8Array>; status?: number }> {
  const [rscStream1, rscStream2] = rscStream.tee();

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(rscStream1);
    return React.use(payload).root;
  }

  let htmlStream: ReadableStream<Uint8Array>;
  let status: number | undefined;

  if (options?.ssg) {
    const prerenderResult = await prerender(<SsrRoot />, {
      bootstrapScripts: options.bootstrapScripts,
    });
    htmlStream = prerenderResult.prelude;
  } else {
    try {
      htmlStream = await renderToReadableStream(<SsrRoot />, {
        bootstrapScripts: options?.bootstrapScripts,
      });
    } catch {
      status = 500;
      htmlStream = await renderToReadableStream(
        <html lang="en">
          <body>
            <noscript>Internal Server Error: SSR failed</noscript>
          </body>
        </html>,
        {
          bootstrapScripts: options?.bootstrapScripts,
        },
      );
    }
  }

  return {
    stream: htmlStream.pipeThrough(injectRSCPayload(rscStream2)),
    status,
  };
}
