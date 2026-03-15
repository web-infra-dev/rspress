import { hydrateRoot } from 'react-dom/client';
import { createFromReadableStream } from 'react-server-dom-rspack/client.browser';
import { rscStream } from 'rsc-html-stream/client';
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
  hydrateRoot(document, initialPayload.root);
}

hydrate();
