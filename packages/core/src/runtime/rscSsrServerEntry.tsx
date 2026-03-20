import type { UserConfig } from '@rspress/shared';
import { transformHtmlTemplate, type Unhead } from '@unhead/react/server';
import React from 'react';
import { renderToReadableStream } from 'react-dom/server.edge';
import { createFromReadableStream } from 'react-server-dom-rspack/client.edge';
import { injectRSCPayload } from 'rsc-html-stream/server';
import { renderHtmlTemplate } from '../node/ssg/renderHtmlTemplate';
import { AppShell } from './AppShell';
import type { RscPayload } from './rsc/shared';
import { renderToRscStream } from './rscServerEntry';
import { ServerRuntimeProviders } from './ServerRuntimeProviders';
import type { SSRRender, SSRRenderOptions } from './ssrRender';

async function readReadableStream(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let content = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    content += decoder.decode(value, { stream: true });
  }

  content += decoder.decode();
  return content;
}

function createStringStream(content: string) {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(content));
      controller.close();
    },
  });
}

async function renderAppHtml(
  routePath: string,
  head: Unhead,
  payloadPromise: Promise<RscPayload>,
) {
  function SsrRoot() {
    const payload = React.use(payloadPromise);

    return (
      <ServerRuntimeProviders
        initialPageData={payload.page}
        head={head}
        routePath={routePath}
        contentSource={payload.contentSource}
      >
        {payload.root ?? <AppShell />}
      </ServerRuntimeProviders>
    );
  }

  const htmlStream = await renderToReadableStream(<SsrRoot />);
  return readReadableStream(htmlStream);
}

async function renderDocumentHtml(
  appHtml: string,
  head: Unhead,
  configHead: UserConfig['head'],
  options?: SSRRenderOptions,
) {
  if (!options?.htmlTemplate || !options.route) {
    return appHtml;
  }

  const replacedHtmlTemplate = await renderHtmlTemplate(
    options.htmlTemplate,
    configHead,
    options.route,
    appHtml,
  );
  return transformHtmlTemplate(head, replacedHtmlTemplate);
}

export const render: SSRRender = async (
  routePath: string,
  head: Unhead,
  configHead,
  options,
) => {
  const { rscStream } = await renderToRscStream(routePath, head, configHead);
  const [rscStreamForPayload, rscStreamForInjection] = rscStream.tee();
  const payloadPromise =
    createFromReadableStream<RscPayload>(rscStreamForPayload);

  const appHtml = await renderAppHtml(routePath, head, payloadPromise);
  const documentHtml = await renderDocumentHtml(
    appHtml,
    head,
    configHead,
    options,
  );

  if (!options?.htmlTemplate || !options.route) {
    return { appHtml: documentHtml };
  }

  const injectedHtmlStream = createStringStream(documentHtml).pipeThrough(
    injectRSCPayload(rscStreamForInjection),
  );

  return {
    appHtml: await readReadableStream(injectedHtmlStream),
  };
};

export { routes } from 'virtual-routes';
