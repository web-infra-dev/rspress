import { spawn, spawnSync } from 'node:child_process';
import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

const harnessRoot = fileURLToPath(new URL('./', import.meta.url));

async function isReady(url: string, signal?: AbortSignal) {
  signal?.throwIfAborted();
  try {
    const timeout = AbortSignal.timeout(2_000);
    const response = await fetch(url, {
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    await response.body?.cancel();
    signal?.throwIfAborted();
    return response.ok;
  } catch {
    signal?.throwIfAborted();
    return false;
  }
}

export async function startFixtureServer(
  baseUrl: string,
  logPath: string,
  signal?: AbortSignal,
): Promise<() => Promise<void>> {
  const url = new URL(baseUrl);
  if (await isReady(baseUrl, signal)) return async () => {};
  if (url.hostname === '[::1]') {
    throw new Error(
      'Automatic fixture startup supports only IPv4 loopback; start the IPv6 server separately',
    );
  }
  if (
    url.protocol !== 'http:' ||
    !['localhost', '127.0.0.1'].includes(url.hostname)
  ) {
    throw new Error(`External mock server is unavailable: ${url.origin}`);
  }

  // The server serves client assets and must not inherit model credentials.
  // cspell:words SYSTEMROOT LOCALAPPDATA
  const env: NodeJS.ProcessEnv = {};
  for (const key of [
    'PATH',
    'HOME',
    'USER',
    'SHELL',
    'TMPDIR',
    'TMP',
    'TEMP',
    'SYSTEMROOT',
    'APPDATA',
    'LOCALAPPDATA',
    'PNPM_HOME',
    'NODE_OPTIONS',
    'CI',
  ]) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  env.FIXTURE_PORT = url.port || '80';

  await mkdir(path.dirname(logPath), { recursive: true });
  const log = await open(logPath, 'w');
  const child = spawn(
    process.execPath,
    [fileURLToPath(new URL('scripts/serve.mjs', import.meta.url))],
    {
      cwd: harnessRoot,
      env,
      detached: process.platform !== 'win32',
      stdio: ['ignore', log.fd, log.fd],
    },
  );
  let spawnError: Error | undefined;
  const closed = new Promise<void>(resolve => {
    child.once('error', error => {
      spawnError = error;
      resolve();
    });
    child.once('close', () => resolve());
  });
  await log.close();
  const signalGroup = (signal: NodeJS.Signals) => {
    if (!child.pid) return;
    try {
      if (process.platform === 'win32') {
        const result = spawnSync(
          'taskkill',
          ['/pid', String(child.pid), '/t', '/f'],
          { windowsHide: true },
        );
        if (result.error) throw result.error;
        // taskkill uses 128 when the process has already exited.
        if (result.status !== 0 && result.status !== 128)
          throw new Error(
            'Fixture process tree cleanup failed: ' + result.stderr,
          );
      } else process.kill(-child.pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ESRCH') throw error;
    }
  };
  const onExit = () => signalGroup('SIGKILL');
  let stopping: Promise<void> | undefined;
  const stop = () =>
    (stopping ??= (async () => {
      signalGroup('SIGTERM');
      await Promise.race([closed, delay(5_000, undefined, { ref: false })]);
      if (process.platform !== 'win32') signalGroup('SIGKILL');
      await closed;
      process.off('exit', onExit);
    })());
  process.once('exit', onExit);
  try {
    // The synthetic fixture can compile local product packages before listening.
    const deadline = Date.now() + 360_000;
    while (Date.now() < deadline) {
      signal?.throwIfAborted();
      if (spawnError) throw spawnError;
      if (child.exitCode !== null || child.signalCode !== null) {
        throw new Error(`Mock server exited before readiness; see ${logPath}`);
      }
      if (await isReady(baseUrl, signal)) return stop;
      await delay(1_000, undefined, { signal });
    }
    throw new Error(`Mock server readiness timed out; see ${logPath}`);
  } catch (error) {
    await stop();
    throw error;
  }
}
