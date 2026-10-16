import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { OriginalFixture } from './original-fixture.ts';
import {
  fixtureMutations,
  fixturePolicy,
  originalFixtures,
} from './original-fixture-data.ts';

async function liveFixture(t, ignoreTerm = false) {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-signal-exit-'));
  const fixture = new OriginalFixture(root);
  t.after(async () => {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
  await mkdir(path.join(root, 'e2e/fixtures/search'), { recursive: true });
  await writeFile(
    path.join(root, 'packages/core/bin/rspress.js'),
    `
    const { createServer } = require('node:http');
    ${ignoreTerm ? "process.on('SIGTERM', () => {});" : ''}
    createServer((_request, response) => response.end(String(process.pid)))
      .listen(Number(process.argv.at(-1)), '127.0.0.1');
  `,
  );
  const origin = await fixture.open('search');
  const pid = Number(await (await fetch(origin)).text());
  return { fixture, origin, pid };
}

async function terminatedFixture(t) {
  const { fixture, origin, pid } = await liveFixture(t);
  process.kill(pid, 'SIGTERM');
  // Wait until the OS has reaped the process, not merely dispatched its signal.
  for (let index = 0; index < 100; index++) {
    try {
      process.kill(pid, 0);
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
      return { fixture, origin };
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error('Diagnostic child did not terminate');
}

test(
  'teardown escalates an ignored SIGTERM and waits for actual exit',
  { timeout: 10_000 },
  async t => {
    const { fixture, origin } = await liveFixture(t, true);
    await fixture.close();
    await assert.rejects(fetch(origin));
  },
);

test('close completes when the fixture has already exited by signal', async t => {
  const { fixture } = await terminatedFixture(t);
  let timer;
  try {
    await Promise.race([
      fixture.close(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('close hung after signal exit')),
          1000,
        );
      }),
    ]);
    await fixture.close();
  } finally {
    clearTimeout(timer);
  }
});

test('a signal-terminated fixture is restarted rather than reused', async t => {
  const { fixture, origin } = await terminatedFixture(t);
  const fresh = await fixture.open('search');
  assert.notEqual(fresh, origin);
  assert.equal((await fetch(fresh)).status, 200);
});

test('signal exits during startup and production builds fail promptly and cleanly', async t => {
  const root = await mkdtemp(path.join(tmpdir(), 'rspress-startup-signal-'));
  const fixture = new OriginalFixture(root);
  t.after(async () => {
    await fixture.close();
    await rm(root, { recursive: true, force: true });
  });
  await mkdir(path.join(root, 'packages/core/bin'), { recursive: true });
  await mkdir(path.join(root, 'e2e/fixtures/search'), { recursive: true });
  await writeFile(
    path.join(root, 'packages/core/bin/rspress.js'),
    "process.kill(process.pid, 'SIGTERM');",
  );
  await assert.rejects(fixture.open('search'), /failed to start/);
  await assert.rejects(
    fixture.open('search', 'production'),
    /Production fixture build failed/,
  );
  await fixture.close();
});

test('fixture capabilities share the mutation isolation policy and browser requirements', () => {
  for (const name of originalFixtures) {
    const mutable = Object.values(fixtureMutations).some(mutation =>
      mutation.fixtures.includes(name),
    );
    assert.equal(fixturePolicy(name).isolated, mutable, name);
    assert.deepEqual(
      fixturePolicy(name),
      {
        isolated: [
          'hmr',
          'hmr-lazy',
          'plugin-preview',
          'plugin-playground',
        ].includes(name),
        previewPort: ['plugin-preview', 'plugin-preview-custom-entry'].includes(
          name,
        ),
        playgroundAssets: name.startsWith('plugin-playground'),
        iframeOrigins:
          name.startsWith('plugin-preview') ||
          name === 'plugin-playground-preview',
        waitForFrames: name.startsWith('plugin-preview'),
        readyPath: ['search', 'multi-version', 'page-type-home'].includes(name)
          ? '/base/'
          : '/',
        readySelector:
          name === 'nav-link-item-with-hash'
            ? '#pageA'
            : 'h1, .rp-home-hero, .rspress-doc, .rp-overview',
      },
      name,
    );
  }
  assert.equal(fixturePolicy('plugin-preview').previewPort, true);
  assert.equal(
    fixturePolicy('plugin-preview-custom-entry').waitForFrames,
    true,
  );
  assert.equal(fixturePolicy('plugin-playground-preview').iframeOrigins, true);
  assert.equal(
    fixturePolicy('plugin-playground-preview').playgroundAssets,
    true,
  );
  assert.equal(
    fixturePolicy('nav-link-item-with-hash').readySelector,
    '#pageA',
  );
  assert.equal(fixturePolicy('search').readyPath, '/base/');
  assert.equal(fixturePolicy().isolated, false);
});

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
