import { getRoutePathParts, normalizeRoutePath } from './normalizeRoutePath';

test('getRoutePathParts', () => {
  expect(
    getRoutePathParts(
      '/v1/en/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "",
      "",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts(
      '/v1/zh/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "",
      "zh",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts(
      '/v2/en/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "v2",
      "",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts(
      '/v2/zh/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "v2",
      "zh",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts(
      '/v2/en/api/',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "v2",
      "",
      "api/",
    ]
  `);

  expect(
    getRoutePathParts('/foo/bar', '/', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "",
      "",
      "foo/bar",
    ]
  `);

  expect(
    getRoutePathParts(
      '/foo/bar/baz.xyz',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "",
      "",
      "foo/bar/baz.xyz",
    ]
  `);

  expect(
    getRoutePathParts(
      '/foo/bar/baz.xyz',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "/",
      "",
      "",
      "foo/bar/baz.xyz",
    ]
  `);
});

test('normalizeRoutePath', () => {
  expect(
    normalizeRoutePath(
      '/v1/en/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'en',
    version: 'v1',
    routePath: '/foo/bar',
  });
  expect(
    normalizeRoutePath(
      '/v1/zh/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'zh',
    version: 'v1',
    routePath: '/zh/foo/bar',
  });
  expect(
    normalizeRoutePath(
      '/v2/en/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'en',
    version: 'v2',
    routePath: '/v2/foo/bar',
  });
  expect(
    normalizeRoutePath(
      '/v2/zh/foo/bar',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'zh',
    version: 'v2',
    routePath: '/v2/zh/foo/bar',
  });
  expect(
    normalizeRoutePath(
      '/v2/en/api/',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'en',
    version: 'v2',
    routePath: '/v2/api/',
  });

  expect(
    normalizeRoutePath('/foo/bar', '/', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toEqual({
    lang: 'en',
    version: 'v1',
    routePath: '/foo/bar',
  });

  expect(
    normalizeRoutePath(
      '/foo/bar/baz.xyz',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toEqual({
    lang: 'en',
    version: 'v1',
    routePath: '/foo/bar/baz.xyz',
  });

  expect(
    normalizeRoutePath(
      '/foo/bar/baz.xyz',
      '/',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
      ['.xyz'],
    ),
  ).toEqual({
    lang: 'en',
    version: 'v1',
    routePath: '/foo/bar/baz',
  });
});
