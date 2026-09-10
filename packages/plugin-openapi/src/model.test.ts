import { describe, expect, it } from '@rstest/core';
import { fixture } from './fixture';
import { getOperations, resolveRef, schemaExample } from './model';
import { prepareRequest } from './web/request';
import { generateSnippet, languages } from './web/snippets';

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
