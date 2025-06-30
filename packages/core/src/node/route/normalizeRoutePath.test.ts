import { getRoutePathParts, normalizeRoutePath } from './normalizeRoutePath';

test('getRoutePathParts', () => {
  expect(
    getRoutePathParts('/v1/en/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "",
      "",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts('/v1/zh/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "",
      "zh",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts('/v2/en/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "v2",
      "",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts('/v2/zh/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "v2",
      "zh",
      "foo/bar",
    ]
  `);
  expect(
    getRoutePathParts('/v2/en/api/', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "v2",
      "",
      "api/",
    ]
  `);

  expect(
    getRoutePathParts('/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    [
      "",
      "",
      "foo/bar",
    ]
  `);

  expect(
    getRoutePathParts(
      '/foo/bar/baz.xyz',

      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
      "",
      "",
      "foo/bar/baz.xyz",
    ]
  `);

  expect(
    getRoutePathParts(
      '/foo/bar/baz.xyz',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    [
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
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(
    {
      lang: 'en',
      version: 'v1',
      routePath: '/foo/bar',
    },
    `
    {
      "lang": "en",
      "routePath": "/foo/bar",
      "version": "v1",
    }
  `,
  );
  expect(
    normalizeRoutePath(
      '/v1/zh/foo/bar',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(
    {
      lang: 'zh',
      version: 'v1',
      routePath: '/zh/foo/bar',
    },
    `
    {
      "lang": "zh",
      "routePath": "/zh/foo/bar",
      "version": "v1",
    }
  `,
  );
  expect(
    normalizeRoutePath(
      '/v2/en/foo/bar',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(
    {
      lang: 'en',
      version: 'v2',
      routePath: '/v2/foo/bar',
    },
    `
    {
      "lang": "en",
      "routePath": "/v2/foo/bar",
      "version": "v2",
    }
  `,
  );
  expect(
    normalizeRoutePath(
      '/v2/zh/foo/bar',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(
    {
      lang: 'zh',
      version: 'v2',
      routePath: '/v2/zh/foo/bar',
    },
    `
    {
      "lang": "zh",
      "routePath": "/v2/zh/foo/bar",
      "version": "v2",
    }
  `,
  );
  expect(
    normalizeRoutePath('/v2/en/api/', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "routePath": "/v2/api",
      "version": "v2",
    }
  `);

  expect(
    normalizeRoutePath('/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "routePath": "/foo/bar",
      "version": "v1",
    }
  `);

  expect(
    normalizeRoutePath(
      '/foo/bar/baz.xyz',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "routePath": "/foo/bar/baz.xyz",
      "version": "v1",
    }
  `);

  expect(
    normalizeRoutePath(
      '/foo/bar/baz.xyz',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
      ['.xyz'],
    ),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "routePath": "/foo/bar/baz",
      "version": "v1",
    }
  `);
});
