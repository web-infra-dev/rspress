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
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "pureRoutePath": "/foo/bar",
      "routePath": "/foo/bar",
      "version": "v1",
    }
  `);
  expect(
    normalizeRoutePath(
      '/v1/zh/foo/bar',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
    ),
  ).toMatchInlineSnapshot(
    `
    {
      "lang": "zh",
      "pureRoutePath": "/foo/bar",
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
    `
    {
      "lang": "en",
      "pureRoutePath": "/foo/bar",
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
    `
    {
      "lang": "zh",
      "pureRoutePath": "/foo/bar",
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
      "pureRoutePath": "/api/",
      "routePath": "/v2/api/",
      "version": "v2",
    }
  `);

  expect(
    normalizeRoutePath('/foo/bar', 'en', 'v1', ['zh', 'en'], ['v1', 'v2']),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "pureRoutePath": "/foo/bar",
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
      "pureRoutePath": "/foo/bar/baz.xyz",
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
      "pureRoutePath": "/foo/bar/baz",
      "routePath": "/foo/bar/baz",
      "version": "v1",
    }
  `);
});

test('normalizeRoutePath real world cases - [](/zh/guide/getting-started) [](/en/guide/getting-started) [](/guide/getting-started)', () => {
  expect(
    normalizeRoutePath(
      '/zh/guide/getting-started',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
      ['.xyz'],
    ),
  ).toMatchInlineSnapshot(`
    {
      "lang": "zh",
      "pureRoutePath": "/guide/getting-started",
      "routePath": "/zh/guide/getting-started",
      "version": "v1",
    }
  `);

  expect(
    normalizeRoutePath(
      '/en/guide/getting-started',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
      ['.xyz'],
    ),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "pureRoutePath": "/guide/getting-started",
      "routePath": "/guide/getting-started",
      "version": "v1",
    }
  `);

  expect(
    normalizeRoutePath(
      '/guide/getting-started',
      'en',
      'v1',
      ['zh', 'en'],
      ['v1', 'v2'],
      ['.xyz'],
    ),
  ).toMatchInlineSnapshot(`
    {
      "lang": "en",
      "pureRoutePath": "/guide/getting-started",
      "routePath": "/guide/getting-started",
      "version": "v1",
    }
  `);
});
