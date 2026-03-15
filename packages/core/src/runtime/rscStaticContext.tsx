import type { RouteMeta, UserConfig } from '@rspress/shared';
import type { ServerEntry } from 'react-server-dom-rspack/server.edge';
import { initPageData } from './initPageData';
import { pathnameToRouteService } from './route';
import Document from './rsc/Document';
import type { RscPayload } from './rsc/shared';

type DocumentComponent = ServerEntry<
  React.ComponentType<{
    page: Awaited<ReturnType<typeof initPageData>>;
    PageComponent: React.ComponentType<unknown>;
    configHead?: UserConfig['head'];
    routeMeta: RouteMeta;
  }>
>;

export async function createStaticRenderContext(
  routePath: string,
  configHead?: UserConfig['head'],
) {
  const route = pathnameToRouteService(routePath);
  const page = await initPageData(routePath);
  const mod = route ? await route.preload() : null;
  const PageComponent = (mod?.default ?? (() => null)) as React.ComponentType<unknown>;
  const routeMeta: RouteMeta = {
    routePath,
    absolutePath: page._filepath as string,
    relativePath: page._relativePath as string,
    pageName:
      (page._relativePath as string)?.split('/').pop()?.replace(/\.\w+$/, '') ||
      'index',
    lang: page.lang || '',
    version: page.version || '',
  };

  return buildPayload({
    page,
    PageComponent,
    configHead,
    routeMeta,
  });
}

function buildPayload({
  page,
  PageComponent,
  configHead,
  routeMeta,
}: {
  page: Awaited<ReturnType<typeof initPageData>>;
  PageComponent: React.ComponentType<unknown>;
  configHead?: UserConfig['head'];
  routeMeta: RouteMeta;
}) {
  const Root = Document as unknown as DocumentComponent;

  const cssLinks = Root.entryCssFiles
    ? Root.entryCssFiles.map((href: string) => (
        <link key={href} rel="stylesheet" href={href} precedence="default" />
      ))
    : null;

  const payload: RscPayload = {
    root: (
      <>
        {cssLinks}
        <Root
          page={page}
          PageComponent={PageComponent}
          configHead={configHead}
          routeMeta={routeMeta}
        />
      </>
    ),
  };

  return {
    payload,
    bootstrapScripts: Root.entryJsFiles,
  };
}
