import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { OriginalFixture } from './original-fixture.ts';

test('original fixture rejects arbitrary directories before spawning', async () => {
  const fixture = new OriginalFixture('/not-a-repository');
  await assert.rejects(fixture.open('../other'), /Unknown original fixture/);
  await fixture.close();
});

test('original fixture reuses a server and closes it before switching fixtures', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-original-fixture-'));
  const fixture = new OriginalFixture(root);
  try {
    await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
    for (const name of ['search', 'tabs-component']) {
      await mkdir(path.join(root, 'e2e/fixtures', name), { recursive: true });
    }
    await writeFile(
      path.join(root, 'packages/core/bin/rspress.js'),
      `
      const { createServer } = require('node:http');
      const port = Number(process.argv.at(-1));
      const server = createServer((_request, response) => response.end('ready'));
      server.listen(port, '127.0.0.1');
      process.on('SIGTERM', () => server.close(() => process.exit()));
    `,
    );
    const first = await fixture.open('search');
    assert.equal(await fixture.open('search'), first);
    const second = await fixture.open('tabs-component');
    assert.notEqual(second, first);
    await assert.rejects(fetch(first));
    assert.equal(await (await fetch(second)).text(), 'ready');
    await fixture.close();
    await assert.rejects(fetch(second));
  } finally {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('a missing fixture directory reports a startup error and can be cleaned up', async () => {
  const fixture = new OriginalFixture('/not-a-repository');
  await assert.rejects(fixture.open('search'), /failed to start/);
  await fixture.close();
});

test('fixture aliases pass CLI base and config arguments to development and production', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-fixture-args-'));
  const fixture = new OriginalFixture(root);
  try {
    await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
    for (const name of ['basic', 'clean-urls-redirect']) {
      await mkdir(path.join(root, 'e2e/fixtures', name), { recursive: true });
    }
    await writeFile(
      path.join(root, 'packages/core/bin/rspress.js'),
      `
      const { createServer } = require('node:http');
      const { readFileSync, writeFileSync } = require('node:fs');
      const args = process.argv.slice(2);
      if (args[0] === 'build') {
        writeFileSync('build-args.json', JSON.stringify(args));
      } else {
        const build = args[0] === 'preview' ? JSON.parse(readFileSync('build-args.json')) : null;
        const server = createServer((_request, response) => response.end(JSON.stringify({ args, build })));
        server.listen(Number(args[args.indexOf('--port') + 1]), '127.0.0.1');
        process.on('SIGTERM', () => server.close(() => process.exit()));
      }
    `,
    );
    for (const [name, expected] of [
      ['basic-cli-base', ['--base', '/bar/']],
      [
        'clean-urls-redirect-clean',
        ['--config', 'rspress.clean-urls.config.ts'],
      ],
    ]) {
      for (const mode of ['development', 'production']) {
        const origin = await fixture.open(name, mode);
        const { args, build } = await (await fetch(origin)).json();
        assert.equal(args[0], mode === 'production' ? 'preview' : 'dev');
        assert.deepEqual(args.slice(-2), expected);
        if (mode === 'production')
          assert.deepEqual(build, ['build', ...expected]);
        else assert.equal(build, null);
      }
    }
  } finally {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('HMR updates affect a temporary copy, reset between cases, and remove that copy', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-hmr-copy-'));
  const fixture = new OriginalFixture(root);
  try {
    await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
    await mkdir(path.join(root, 'e2e/fixtures/hmr/doc/guide'), {
      recursive: true,
    });
    await mkdir(path.join(root, 'e2e/fixtures/hmr/node_modules'), {
      recursive: true,
    });
    const source = path.join(root, 'e2e/fixtures/hmr/doc/guide/test.mdx');
    await writeFile(source, 'Hello world');
    await writeFile(
      path.join(root, 'packages/core/bin/rspress.js'),
      `
      const { createServer } = require('node:http');
      const { readFileSync } = require('node:fs');
      const server = createServer((_request, response) =>
        response.end(readFileSync('doc/guide/test.mdx')));
      server.listen(Number(process.argv.at(-1)), '127.0.0.1');
      process.on('SIGTERM', () => server.close(() => process.exit()));
    `,
    );
    const origin = await fixture.open('hmr');
    await fixture.update('article');
    assert.equal(await (await fetch(origin)).text(), 'Hello hmr world');
    assert.equal(
      await (await import('node:fs/promises')).readFile(source, 'utf8'),
      'Hello world',
    );
    const fresh = await fixture.open('hmr');
    assert.equal(await (await fetch(fresh)).text(), 'Hello world');
    await fixture.close();
    assert.deepEqual(
      await (
        await import('node:fs/promises')
      ).readdir(path.join(root, 'tests/midscene/.fixture')),
      [],
    );
  } finally {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  }
});

test('fixture updates cannot write before an isolated HMR fixture is opened', async () => {
  const fixture = new OriginalFixture('/not-a-repository');
  await assert.rejects(fixture.update('article'), /isolated HMR fixture first/);
});

test('preview and playground updates are isolated and reject mismatched mutations', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-plugin-hmr-'));
  const fixture = new OriginalFixture(root);
  try {
    await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
    await writeFile(
      path.join(root, 'packages/core/bin/rspress.js'),
      `
      const { createServer } = require('node:http');
      const server = createServer((_request, response) => response.end('ready'));
      server.listen(Number(process.argv.at(-1)), '127.0.0.1');
      process.on('SIGTERM', () => server.close(() => process.exit()));
    `,
    );
    for (const [name, filename, before, part, after] of [
      [
        'plugin-preview',
        'hmr.mdx',
        'HMR Internal Original',
        'preview-internal',
        'HMR Internal Updated',
      ],
      [
        'plugin-playground',
        'index.mdx',
        'Hello World Internal (default)',
        'playground',
        'Hello World Internal (updated)',
      ],
    ]) {
      const source = path.join(root, 'e2e/fixtures', name);
      await mkdir(path.join(source, 'doc'), { recursive: true });
      await mkdir(path.join(source, 'node_modules'));
      await writeFile(path.join(source, 'doc', filename), before);
      await fixture.open(name);
      await assert.rejects(
        fixture.update('article'),
        /isolated HMR fixture first/,
      );
      await fixture.update(part);
      const { readFile, readdir } = await import('node:fs/promises');
      const copies = await readdir(path.join(root, 'tests/midscene/.fixture'));
      assert.equal(copies.length, 1);
      assert.equal(
        await readFile(
          path.join(
            root,
            'tests/midscene/.fixture',
            copies[0],
            'doc',
            filename,
          ),
          'utf8',
        ),
        after,
      );
      assert.equal(
        await readFile(path.join(source, 'doc', filename), 'utf8'),
        before,
      );
      await fixture.close();
      assert.deepEqual(
        await readdir(path.join(root, 'tests/midscene/.fixture')),
        [],
      );
    }
  } finally {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  }
});
