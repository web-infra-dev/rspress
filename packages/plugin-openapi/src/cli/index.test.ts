import { createServer } from 'node:http';
import {
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { fixture } from '../fixture';
import { pluginOpenAPI } from './index';
const utils = { addPlugin() {}, removePlugin() {} };

describe('OpenAPI page generation', () => {
  let root: string;
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'rspress-openapi-'));
  });
  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });
  const read = (file: string) => readFile(path.join(root, file), 'utf8');
  it('writes ordinary MDX and section metadata without adding routes or overriding config', async () => {
    const plugin = pluginOpenAPI({ input: fixture });
    const themeConfig = {
      sidebar: { '/guide/': [{ text: 'Guide', link: '/guide/' }] },
    };
    const config = await plugin.config!({ root, themeConfig }, utils, true);
    expect(config.themeConfig).toEqual(themeConfig);
    expect(plugin.addPages).toBeUndefined();
    expect(
      (await readdir(path.join(root, 'api'))).filter(name =>
        name.endsWith('.mdx'),
      ),
    ).toHaveLength(3);
    const meta = JSON.parse(await read('api/_meta.json'));
    expect(meta).toHaveLength(4);
    expect(meta[0]).toEqual({ type: 'section-header', label: 'Planets' });
    expect(meta[1]).toEqual({
      type: 'file',
      name: 'getallplanets',
      label: 'Get all planets',
      tag: 'GET',
    });
    expect(await read('api/getallplanets.mdx')).toContain('JSON.parse(');
  });
  it('supports a nested output directory and disabling generated metadata', async () => {
    await pluginOpenAPI({
      input: fixture,
      outDir: 'reference/api',
      sidebar: false,
    }).config!({ root }, utils, true);
    expect(await read('reference/api/getallplanets.mdx')).toContain(
      'Get all planets',
    );
    expect(await readdir(path.join(root, 'reference/api'))).not.toContain(
      '_meta.json',
    );
  });
  it('updates generated pages, removes stale operations and preserves handwritten files', async () => {
    const document = structuredClone(fixture);
    const plugin = pluginOpenAPI({ input: document });
    await plugin.config!({ root }, utils, true);
    await writeFile(path.join(root, 'api/guide.mdx'), '# Handwritten guide');
    document.paths['/planets'].get!.summary = 'Updated planets';
    delete document.paths['/planets'].post;
    await plugin.config!({ root }, utils, true);
    expect(await read('api/getallplanets.mdx')).toContain('Updated planets');
    expect(await read('api/guide.mdx')).toBe('# Handwritten guide');
    expect(await readdir(path.join(root, 'api'))).not.toContain(
      'createplanet.mdx',
    );
    expect(await read('api/_meta.json')).not.toContain('createplanet');
  });
  it('preserves customized metadata', async () => {
    const plugin = pluginOpenAPI({ input: fixture });
    await plugin.config!({ root }, utils, true);
    await writeFile(
      path.join(root, 'api/_meta.json'),
      '["getplanet", "getallplanets"]',
    );
    await plugin.config!({ root }, utils, true);
    expect(await read('api/_meta.json')).toBe('["getplanet", "getallplanets"]');
  });
  it('refuses to overwrite handwritten pages or write outside the documentation root', async () => {
    await mkdir(path.join(root, 'api'));
    await writeFile(path.join(root, 'api/getallplanets.mdx'), '# My page');
    await expect(
      pluginOpenAPI({ input: fixture }).config!({ root }, utils, true),
    ).rejects.toThrow('Refusing to overwrite');
    expect(await read('api/getallplanets.mdx')).toBe('# My page');
    await expect(
      pluginOpenAPI({ input: fixture, outDir: '../outside' }).config!(
        { root },
        utils,
        true,
      ),
    ).rejects.toThrow('inside the documentation root');
  });
  it('rejects colliding slugs before writing pages', async () => {
    const document = structuredClone(fixture);
    document.paths['/planets'].post!.operationId = 'GETALLPLANETS';
    await expect(
      pluginOpenAPI({ input: document }).config!({ root }, utils, true),
    ).rejects.toThrow('Conflicting');
    expect(await readdir(root)).toEqual([]);
  });
  it('loads YAML with an external recursive schema', async () => {
    await writeFile(
      path.join(root, 'planet.json'),
      JSON.stringify({ type: 'object', properties: { child: { $ref: '#' } } }),
    );
    await writeFile(
      path.join(root, 'openapi.yaml'),
      'openapi: 3.0.3\ninfo:\n  title: Test\n  version: 1.0.0\npaths:\n  /planet:\n    get:\n      responses:\n        "200":\n          description: OK\n          content:\n            application/json:\n              schema:\n                $ref: ./planet.json\n',
    );
    await pluginOpenAPI({ input: path.join(root, 'openapi.yaml') }).config!(
      { root },
      utils,
      true,
    );
    expect(await read('api/get-planet.mdx')).toContain('APIReference');
  });
  it.each([false, true])(
    'resolves remote servers including empty lists (%s)',
    async empty => {
      const document = structuredClone(fixture);
      document.servers = empty
        ? []
        : [{ url: '/v2/{region}', variables: { region: { default: 'eu' } } }];
      const server = createServer((_, response) => {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify(document));
      });
      await new Promise<void>(resolve =>
        server.listen(0, '127.0.0.1', resolve),
      );
      try {
        const address = server.address() as { port: number };
        const origin = `http://127.0.0.1:${address.port}`;
        await pluginOpenAPI({
          input: `${origin}/spec/openapi.json`,
          allowPrivateUrls: true,
        }).config!({ root }, utils, true);
        expect(await read('api/getallplanets.mdx')).toContain(
          empty ? `${origin}/` : `${origin}/v2/{region}`,
        );
      } finally {
        await new Promise<void>((resolve, reject) =>
          server.close(error => (error ? reject(error) : resolve())),
        );
      }
    },
  );
  it('upgrades Swagger 2.0 files', async () => {
    const file = path.join(root, 'swagger.json');
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
    await pluginOpenAPI({ input: file }).config!({ root }, utils, true);
    expect(await read('api/get-ping.mdx')).toContain('https://example.com/v1');
  });
});
