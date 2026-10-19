import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { startFixtureServer } from '../fixture-server.ts';

async function freePort() {
  const server = createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('unavailable IPv6 fails promptly without launching an IPv4 fixture', async () => {
  const port = await freePort();
  await assert.rejects(
    startFixtureServer(
      'http://[::1]:' + port,
      path.join(tmpdir(), 'unused-midscene-ipv6.log'),
      AbortSignal.timeout(500),
    ),
    /Automatic fixture startup supports only IPv4 loopback/,
  );
});

test('an existing server is reused without taking ownership of it', async t => {
  const server = createServer((_request, response) => response.end('external'));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const url = 'http://127.0.0.1:' + server.address().port;
  const stop = await startFixtureServer(url, 'unused.log');
  await stop();
  assert.equal(await (await fetch(url)).text(), 'external');
});

test(
  'stop waits until the fixture wrapper and its server descendant are gone',
  { timeout: 15_000 },
  async t => {
    const root = await mkdtemp(path.join(tmpdir(), 'midscene-process-tree-'));
    let stop;
    let pid;
    t.after(async () => {
      await stop?.();
      if (pid) {
        try {
          process.kill(pid, 'SIGKILL');
        } catch (error) {
          if (error.code !== 'ESRCH') throw error;
        }
      }
      await rm(root, { recursive: true, force: true });
    });
    await mkdir(path.join(root, 'scripts'));
    await writeFile(
      path.join(root, 'fixture-server.ts'),
      await readFile(new URL('../fixture-server.ts', import.meta.url)),
    );
    await writeFile(
      path.join(root, 'scripts/worker.mjs'),
      `
    import { createServer } from 'node:http';
    process.on('SIGTERM', () => {});
    createServer((_request, response) => response.end(String(process.pid)))
      .listen(Number(process.env.FIXTURE_PORT), '127.0.0.1');
  `,
    );
    await writeFile(
      path.join(root, 'scripts/serve.mjs'),
      `
    import { spawn } from 'node:child_process';
    import { fileURLToPath } from 'node:url';
    const child = spawn(process.execPath, [fileURLToPath(new URL('./worker.mjs', import.meta.url))], { stdio: 'inherit' });
    process.on('SIGTERM', () => child.kill('SIGTERM'));
    child.on('exit', () => process.exit());
  `,
    );
    const port = await freePort();
    const url = 'http://127.0.0.1:' + port;
    const fixture = await import(
      pathToFileURL(path.join(root, 'fixture-server.ts')).href
    );
    stop = await fixture.startFixtureServer(
      url,
      path.join(root, 'fixture.log'),
    );
    pid = Number(await (await fetch(url)).text());
    await Promise.all([stop(), stop()]);
    await assert.rejects(fetch(url));
    assert.throws(() => process.kill(pid, 0), { code: 'ESRCH' });
  },
);
