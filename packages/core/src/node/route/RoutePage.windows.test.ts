import { describe, expect, it, rs } from '@rstest/core';
import actualPath from 'node:path' with { rstest: 'importActual' };

rs.mock('node:path', () => ({
  ...actualPath,
  default: actualPath.win32,
}));

import { RoutePage } from './RoutePage';
import { RouteService } from './RouteService';
import { getRouteChunkName } from './routeChunkAssets';

describe('RoutePage on Windows', () => {
  it('stores native paths and safely serializes them as module requests', async () => {
    const routeService = await RouteService.createSimple();
    RouteService.__instance__ = routeService;

    const routePage = RoutePage.createFromExternal(
      '/guide',
      'C:/repo/docs/guide/index.mdx',
      'C:/repo/docs',
    );
    const scannedRoutePage = RoutePage.create(
      'C:/repo/docs/index.mdx',
      'C:/repo/docs',
    );
    await routeService.addRoute(routePage);

    const absolutePath = String.raw`C:\repo\docs\guide\index.mdx`;
    expect(routePage.routeMeta.absolutePath).toBe(absolutePath);
    expect(scannedRoutePage.routeMeta.absolutePath).toBe(
      String.raw`C:\repo\docs\index.mdx`,
    );
    expect(routePage.routeMeta.relativePath).toBe('guide/index.mdx');
    expect(routeService.getRoutePageByFilePath(absolutePath)).toBe(routePage);
    expect(
      routeService.getRoutePageByFilePath('C:/repo/docs/./guide/index.mdx'),
    ).toBe(routePage);
    expect(routeService.generateRoutesCode()).toContain(
      String.raw`import(/* webpackChunkName: "${getRouteChunkName(routePage.routeMeta)}" */ "C:\\repo\\docs\\guide\\index.mdx")`,
    );
  });
});
