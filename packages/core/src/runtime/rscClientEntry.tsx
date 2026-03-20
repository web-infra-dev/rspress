import { hydrateRoot } from 'react-dom/client';
import { createFromReadableStream } from 'react-server-dom-rspack/client.browser';
import { rscStream } from 'rsc-html-stream/client';
import { ClientRuntimeBridge } from './ClientRuntimeBridge';
import type { RscPayload } from './rsc/shared';
import * as clientReferences from './rscClientReferences';

if (typeof globalThis !== 'undefined') {
  (
    globalThis as typeof globalThis & {
      __RSPRESS_RSC_CLIENT_REFERENCES__?: typeof clientReferences;
    }
  ).__RSPRESS_RSC_CLIENT_REFERENCES__ = clientReferences;
}

async function hydrate() {
  const initialPayload = await createFromReadableStream<RscPayload>(rscStream);
  const container = document.getElementById('__rspress_root');

  if (!container) {
    throw new Error('Failed to find `#__rspress_root` for RSC hydration.');
  }

  hydrateRoot(
    container,
    <ClientRuntimeBridge
      initialPageData={initialPayload.page}
      contentSource={initialPayload.contentSource}
    >
      {initialPayload.root}
    </ClientRuntimeBridge>,
  );
}

hydrate();
