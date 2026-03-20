import React from 'react';
import { AppShell } from './AppShell';
import { initPageData } from './initPageData';
import { pathnameToRouteService } from './route';
import type { RscPayload } from './rsc/shared';

export async function createStaticRenderContext(routePath: string) {
  const route = pathnameToRouteService(routePath);
  const page = await initPageData(routePath);
  const mod = route ? await route.preload() : null;
  const PageComponent = mod?.default as
    | React.ComponentType<unknown>
    | undefined;

  const payload: RscPayload = {
    root: <AppShell />,
    page,
    contentSource: PageComponent ? React.createElement(PageComponent) : null,
  };

  return { payload };
}
