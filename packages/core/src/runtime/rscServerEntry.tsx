import type { UserConfig } from '@rspress/shared';
import { renderToReadableStream } from 'react-server-dom-rspack/server.edge';
import { createStaticRenderContext } from './rscStaticContext';

export async function renderStaticRsc(
  routePath: string,
  configHead?: UserConfig['head'],
): Promise<{
  stream: ReadableStream<Uint8Array>;
  bootstrapScripts?: string[];
}> {
  const { payload, bootstrapScripts } = await createStaticRenderContext(
    routePath,
    configHead,
  );

  return {
    stream: renderToReadableStream(payload),
    bootstrapScripts,
  };
}
