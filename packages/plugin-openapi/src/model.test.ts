import { describe, expect, it } from '@rstest/core';
import { fixture } from './fixture';
import { getOperations, resolveRef, schemaExample } from './model';
import { prepareRequest, requestBodyExample, serverURL } from './web/request';
import {
  generateSnippet,
  prepareExampleRequest,
  languages,
} from './web/snippets';

const input = {
  server: 'https://example.com/v1',
  values: {},
  auth: {},
  securityIndex: 0,
  body: '',
  mediaType: '',
};
describe('OpenAPI model and requests', () => {
  it('inherits path parameters and allows operation overrides', () => {
    const document = structuredClone(fixture);
    document.paths['/planets/{id}'].get!.parameters = [
      { name: 'id', in: 'path', required: true, description: 'Override' },
    ];
    const operation = getOperations(document)[2];
    expect(operation.parameters).toHaveLength(1);
    expect(operation.parameters[0].description).toBe('Override');
    expect(operation.servers).toEqual(fixture.servers);
  });
  it('defaults empty server lists without losing server inheritance', () => {
    const document = structuredClone(fixture);
    document.servers = [];
    expect(serverURL(getOperations(document)[0].servers[0])).toBe('/');
    document.servers = [{ url: 'https://root.example.com' }];
    const path = document.paths['/planets'];
    path.servers = [{ url: 'https://path.example.com' }];
    expect(getOperations(document)[0].servers[0].url).toBe(
      'https://path.example.com',
    );
    path.get!.servers = [];
    expect(getOperations(document)[0].servers).toEqual([{ url: '/' }]);
    delete path.get!.servers;
    path.servers = [];
    expect(getOperations(document)[0].servers).toEqual([{ url: '/' }]);
  });
  it('formats examples as HTTP bodies and preserves manually edited content', () => {
    const data = getOperations(fixture)[1];
    const cases = [
      {
        type: 'text/plain; charset=utf-8',
        example: 'hello\nworld',
        expected: 'hello\nworld',
      },
      { type: 'application/json', example: 'hello', expected: '"hello"' },
      {
        type: 'application/x-www-form-urlencoded',
        example: { name: 'Mars & Venus', tags: ['rocky', 'red'] },
        expected: 'name=Mars+%26+Venus&tags=rocky&tags=red',
      },
      {
        type: 'application/x-www-form-urlencoded',
        example: 'name=Mars%20Planet',
        expected: 'name=Mars%20Planet',
      },
    ];
    for (const { type, example, expected } of cases) {
      const body = requestBodyExample(fixture, type, { example });
      expect(body).toBe(expected);
      const request = prepareRequest(fixture, data, {
        ...input,
        body,
        mediaType: type,
      });
      expect(request.body).toBe(expected);
      expect(request.headers['Content-Type']).toBe(type);
    }
    expect(
      requestBodyExample(fixture, 'text/plain', {
        schema: { type: 'string', example: 'Mars' },
      }),
    ).toBe('Mars');
    expect(
      prepareRequest(fixture, data, {
        ...input,
        body: 'name=edited+value',
        mediaType: 'application/x-www-form-urlencoded',
      }).body,
    ).toBe('name=edited+value');
  });
  it('uses placeholder credentials only for examples and honors the selected alternative', () => {
    const document = structuredClone(fixture);
    document.components!.securitySchemes = {
      token: { type: 'http', scheme: 'bearer' },
      key: { type: 'apiKey', name: 'key', in: 'query' },
      basic: { type: 'http', scheme: 'basic' },
    };
    document.security = [{ token: [], key: [] }, { basic: [] }, {}];
    const data = getOperations(document)[0];
    const request = prepareExampleRequest(document, data, input);
    expect(request.headers.Authorization).toBe('Bearer YOUR_ACCESS_TOKEN');
    expect(request.url).toContain('key=YOUR_API_KEY');
    for (const language of languages)
      expect(generateSnippet(request, language)).toContain('YOUR_ACCESS_TOKEN');
    expect(input.auth).toEqual({});
    expect(() => prepareRequest(document, data, input)).toThrow(
      'Enter credentials',
    );
    const actual = {
      ...input,
      auth: { token: 'actual-token', key: 'actual-key' },
    };
    expect(prepareExampleRequest(document, data, actual)).toEqual(
      prepareRequest(document, data, actual),
    );
    expect(
      prepareExampleRequest(document, data, { ...input, securityIndex: 1 })
        .headers.Authorization,
    ).toBe(`Basic ${btoa('username:password')}`);
    expect(
      prepareExampleRequest(document, data, { ...input, securityIndex: 2 })
        .headers,
    ).toEqual({});
  });
  it('bounds recursive examples and resolves escaped pointers', () => {
    expect(() =>
      JSON.stringify(
        schemaExample(fixture, { $ref: '#/components/schemas/Planet' }),
      ),
    ).not.toThrow();
    const document = structuredClone(fixture);
    document.components!.schemas!['a/b~c'] = { type: 'string' };
    expect(
      resolveRef(document, { $ref: '#/components/schemas/a~1b~0c' }),
    ).toEqual({ type: 'string' });
    expect(() => resolveRef(document, { $ref: '#/missing' })).toThrow(
      'Unresolved',
    );
  });
  it('preserves base paths, encodes path values and omits unset query values', () => {
    expect(
      prepareRequest(fixture, getOperations(fixture)[2], {
        ...input,
        values: { 'path:id': 'a/b ?' },
      }).url,
    ).toBe('https://example.com/v1/planets/a%2Fb%20%3F');
    expect(
      prepareRequest(fixture, getOperations(fixture)[0], {
        ...input,
        values: { 'query:limit': '0' },
      }).url,
    ).toBe('https://example.com/v1/planets?limit=0');
  });
  it('serializes arrays and deep objects using their declared style', () => {
    const data = getOperations(fixture)[0];
    data.parameters = [
      { in: 'query', name: 'tags', schema: { type: 'array' } },
      {
        in: 'query',
        name: 'filter',
        style: 'deepObject',
        schema: { type: 'object' },
      },
    ];
    expect(
      prepareRequest(fixture, data, {
        ...input,
        values: {
          'query:tags': '["red","blue"]',
          'query:filter': '{"name":"a&b"}',
        },
      }).url,
    ).toBe(
      'https://example.com/v1/planets?tags=red&tags=blue&filter%5Bname%5D=a%26b',
    );
  });
  it('requires path values, valid JSON bodies and HTTP servers', () => {
    expect(() =>
      prepareRequest(fixture, getOperations(fixture)[2], input),
    ).toThrow('Enter path');
    expect(() =>
      prepareRequest(fixture, getOperations(fixture)[1], {
        ...input,
        mediaType: 'application/json',
        body: '{bad',
      }),
    ).toThrow();
    expect(() =>
      prepareRequest(fixture, getOperations(fixture)[0], {
        ...input,
        server: 'javascript:alert(1)',
      }),
    ).toThrow('HTTP');
  });
  it('honors alternative security requirements and anonymous overrides', () => {
    const document = structuredClone(fixture);
    document.components!.securitySchemes = {
      token: { type: 'http', scheme: 'bearer' },
    };
    document.security = [{ token: [] }];
    const data = getOperations(document)[0];
    expect(
      prepareRequest(document, data, { ...input, auth: { token: 'secret' } })
        .headers.Authorization,
    ).toBe('Bearer secret');
    document.paths['/planets'].get!.security = [];
    expect(
      prepareRequest(document, getOperations(document)[0], input).headers,
    ).toEqual({});
  });
  it('generates all seven languages from the same request', () => {
    const request = prepareRequest(fixture, getOperations(fixture)[0], input);
    for (const language of languages)
      expect(generateSnippet(request, language)).toContain('example.com');
  });
});
