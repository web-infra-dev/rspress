import { join } from 'node:path';
import { describe, expect, it, rs } from '@rstest/core';
import {
  FRAMEWORK_FALLBACK_404_FILEPATH,
  FRAMEWORK_FALLBACK_404_PAGE_NAME,
} from '../../route/RoutePage';
import type { RouteService } from '../../route/RouteService';
import { createPageData } from './createPageData';

describe('createPageData', () => {
  it('keeps framework fallback 404 in runtime page data but excludes it from plugin and search pipelines', async () => {
    const fixtureBasicDir = join(__dirname, '../../route/fixtures/basic');
    const normalPagePath = join(fixtureBasicDir, './a.mdx');

    const routes = [
      {
        absolutePath: normalPagePath,
        lang: '',
        pageName: 'a',
        relativePath: 'a.mdx',
        routePath: '/a',
        version: '',
      },
      {
        absolutePath: FRAMEWORK_FALLBACK_404_FILEPATH,
        lang: '',
        pageName: FRAMEWORK_FALLBACK_404_PAGE_NAME,
        relativePath: FRAMEWORK_FALLBACK_404_FILEPATH,
        routePath: '/404',
        version: '',
      },
    ];

    const pluginDriver = {
      modifySearchIndexData: rs.fn().mockResolvedValue(undefined),
      extendPageData: rs.fn().mockResolvedValue(undefined),
    };

    const result = await createPageData({
      config: {},
      alias: {},
      userDocRoot: fixtureBasicDir,
      routeService: {
        getRoutes: () => routes,
        getRoutePageByRoutePath: () => undefined,
      } as unknown as RouteService,
      pluginDriver: pluginDriver as any,
    });

    expect(
      pluginDriver.modifySearchIndexData.mock.calls[0][0].map(
        (page: { routePath: string }) => page.routePath,
      ),
    ).toEqual(['/a']);
    expect(
      pluginDriver.extendPageData.mock.calls.map(
        ([page]: [{ routePath: string }]) => page.routePath,
      ),
    ).toEqual(['/a']);

    expect(result.filepaths).toEqual([normalPagePath]);
    expect(result.pageData.pages).toMatchInlineSnapshot(`
      [
        {
          "description": undefined,
          "frontmatter": {
            "__content": undefined,
          },
          "lang": "",
          "routePath": "/a",
          "title": "Page a",
          "toc": [],
          "version": "",
        },
        {
          "frontmatter": {
            "pageType": "404",
          },
          "lang": "",
          "routePath": "/404",
          "title": "404",
          "toc": [],
          "version": "",
        },
      ]
    `);
    expect(
      JSON.parse(Object.values(result.searchIndex)[0]).map(
        (page: { routePath: string }) => page.routePath,
      ),
    ).toEqual(['/a']);
  });
});
