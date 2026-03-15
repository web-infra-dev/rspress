import type { UserConfig } from '@rspress/shared';
import type { Unhead } from '@unhead/react/server';
import { renderToReadableStream } from 'react-server-dom-rspack/server.edge';
import { createStaticRenderContext } from './rscStaticContext';

export async function renderToRscStream(
  routePath: string,
  _head: Unhead,
  configHead?: UserConfig['head'],
): Promise<{
  rscStream: ReadableStream<Uint8Array>;
  bootstrapScripts: string[];
}> {
  const { payload, bootstrapScripts = [] } = await createStaticRenderContext(
    routePath,
    configHead,
  );

  return {
    rscStream: renderToReadableStream(payload),
    bootstrapScripts,
  };
}
