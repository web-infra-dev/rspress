import type { UserConfig } from '@rspress/shared';
import type { Unhead } from '@unhead/react/server';
import React from 'react';
import { renderToReadableStream } from 'react-dom/server.edge';
import { createFromReadableStream } from 'react-server-dom-rspack/client.edge';
import { injectRSCPayload } from 'rsc-html-stream/server';
import type { RscPayload } from './rsc/shared';
import { renderToRscStream } from './rscServerEntry';

export async function render(
  routePath: string,
  head: Unhead,
  configHead?: UserConfig['head'],
): Promise<{ appHtml: string }> {
  const { rscStream, bootstrapScripts } = await renderToRscStream(
    routePath,
    head,
    configHead,
  );

  const [rscStream1, rscStream2] = rscStream.tee();

  let payload: Promise<RscPayload>;
  function SsrRoot() {
    payload ??= createFromReadableStream<RscPayload>(rscStream1);
    return React.use(payload).root;
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />, {
    bootstrapScripts,
  });
  const injectedHtmlStream = htmlStream.pipeThrough(injectRSCPayload(rscStream2));

  const reader = injectedHtmlStream.getReader();
  const decoder = new TextDecoder();
  let appHtml = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    appHtml += decoder.decode(value, { stream: true });
  }

  appHtml += decoder.decode();

  return { appHtml };
}
