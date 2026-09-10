import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';
import { fixture } from '../fixture';
import { pluginOpenAPI } from './index';
const utils = { addPlugin() {}, removePlugin() {} };
describe('OpenAPI page generation', () => {
  it('generates pages and preserves unrelated sidebar groups', async () => {
    const plugin = pluginOpenAPI({ input: fixture });
    const config = await plugin.config!(
      {
        themeConfig: {
          sidebar: { '/guide/': [{ text: 'Guide', link: '/guide/' }] },
        },
      },
      utils,
      true,
    );
    expect(config.themeConfig!.sidebar!['/guide/']).toHaveLength(1);
    expect(config.themeConfig!.sidebar!['/api/']).toHaveLength(1);
    const pages = await plugin.addPages!({}, true);
    expect(pages).toHaveLength(3);
    expect(pages[0].routePath).toBe('/api/getallplanets');
    expect(pages[0].content).toContain('JSON.parse(');
  });
  it('rejects colliding route slugs', async () => {
    const document = structuredClone(fixture);
    document.paths['/planets'].post!.operationId = 'GETALLPLANETS';
    await expect(
      pluginOpenAPI({ input: document }).config!({}, utils, true),
    ).rejects.toThrow('Conflicting');
  });
  it('loads YAML with an external recursive schema', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'rspress-openapi-'));
    try {
      await writeFile(
        path.join(directory, 'planet.json'),
        JSON.stringify({
          type: 'object',
          properties: { child: { $ref: '#' } },
        }),
      );
      await writeFile(
        path.join(directory, 'openapi.yaml'),
        'openapi: 3.0.3\ninfo:\n  title: Test\n  version: 1.0.0\npaths:\n  /planet:\n    get:\n      responses:\n        "200":\n          description: OK\n          content:\n            application/json:\n              schema:\n                $ref: ./planet.json\n',
      );
      const plugin = pluginOpenAPI({
        input: path.join(directory, 'openapi.yaml'),
      });
      await plugin.config!({}, utils, true);
      expect(await plugin.addPages!({}, true)).toHaveLength(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
  it('resolves remote server URLs against the specification URL', async () => {
    const document = structuredClone(fixture);
    document.servers = [
      { url: '/v2/{region}', variables: { region: { default: 'eu' } } },
    ];
    const server = createServer((_, response) => {
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify(document));
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address() as { port: number };
      const origin = `http://127.0.0.1:${address.port}`;
      const plugin = pluginOpenAPI({
        input: `${origin}/spec/openapi.json`,
        allowPrivateUrls: true,
      });
      await plugin.config!({}, utils, true);
      expect((await plugin.addPages!({}, true))[0].content).toContain(
        `${origin}/v2/{region}`,
      );
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close(error => (error ? reject(error) : resolve())),
      );
    }
  });
  it('upgrades Swagger 2.0 files', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'rspress-swagger-'));
    try {
      const file = path.join(directory, 'swagger.json');
      await writeFile(
        file,
        JSON.stringify({
          swagger: '2.0',
          info: { title: 'Legacy', version: '1.0' },
          host: 'example.com',
          basePath: '/v1',
          schemes: ['https'],
          paths: {
            '/ping': { get: { responses: { '200': { description: 'OK' } } } },
          },
        }),
      );
      const plugin = pluginOpenAPI({ input: file });
      await plugin.config!({}, utils, true);
      expect((await plugin.addPages!({}, true))[0].content).toContain(
        'https://example.com/v1',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
