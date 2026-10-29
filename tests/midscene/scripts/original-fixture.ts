import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { createServer } from 'node:net';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rename,
  stat,
  writeFile,
  symlink,
  rm,
} from 'node:fs/promises';

import {
  originalFixtures,
  fixtureAliases,
  fixtureSharedDirectories,
  fixtureMutations,
  fixturePolicy,
  type FixtureUpdatePart,
} from './original-fixture-data.ts';

export {
  originalFixtures,
  fixtureUpdateParts,
} from './original-fixture-data.ts';

const isRunning = (child: ChildProcess | undefined): child is ChildProcess =>
  !!child?.pid && child.exitCode === null && child.signalCode === null;

// Released probe ports must not be offered to another concurrently starting fixture.
const allocatedPorts = new Set<number>();

export async function reservePorts(count: number): Promise<number[]> {
  const reservations: ReturnType<typeof createServer>[] = [];
  const ports: number[] = [];
  try {
    while (ports.length < count) {
      const server = createServer();
      reservations.push(server);
      const port = await new Promise<number>((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
          const address = server.address();
          if (!address || typeof address === 'string')
            return reject(new Error('No fixture port'));
          resolve(address.port);
        });
      });
      if (!allocatedPorts.has(port)) {
        allocatedPorts.add(port);
        ports.push(port);
      }
    }
    return ports;
  } finally {
    await Promise.all(
      reservations
        .filter(server => server.listening)
        .map(
          server =>
            new Promise<void>((resolve, reject) =>
              server.close(error => (error ? reject(error) : resolve())),
            ),
        ),
    );
  }
}

export class OriginalFixture {
  private readonly repository: string;
  private readonly isolateAll: boolean;
  constructor(repository: string, isolateAll = false) {
    this.repository = repository;
    this.isolateAll = isolateAll;
  }
  private child?: ChildProcess;
  private fixture?: string;
  private origin?: string;
  private scratch?: string;
  private scratchRoot?: string;
  private production = false;

  async open(
    fixture: string,
    mode: 'development' | 'production' = 'development',
  ): Promise<string> {
    const production = fixture === 'production' || mode === 'production';
    if (!originalFixtures.some(name => name === fixture)) {
      throw new Error(`Unknown original fixture: ${fixture}`);
    }
    const policy = fixturePolicy(fixture);
    if (
      !policy.isolated &&
      this.fixture === fixture &&
      this.production === production &&
      isRunning(this.child)
    ) {
      return this.origin!;
    }
    await this.close();
    const directoryName = fixtureAliases[fixture]?.directory ?? fixture;
    const alias = fixtureAliases[fixture];
    const configArgs = [
      ...(alias?.config ? ['--config', alias.config] : []),
      ...(alias?.args ?? []),
    ];
    const source = path.join(this.repository, 'e2e/fixtures', directoryName);
    let directory = source;
    if (policy.isolated || this.isolateAll) {
      const parent = path.join(this.repository, 'tests/midscene/.fixture');
      await mkdir(parent, { recursive: true });
      this.scratchRoot = await mkdtemp(
        path.join(parent, `${fixture.replaceAll('/', '-')}-`),
      );
      this.scratch = path.join(this.scratchRoot, directoryName);
      await mkdir(path.dirname(this.scratch), { recursive: true });
      for (const sibling of fixtureSharedDirectories[fixture] ?? []) {
        await symlink(
          path.join(this.repository, 'e2e/fixtures', sibling),
          path.join(this.scratchRoot, sibling),
          'dir',
        );
      }
      await cp(source, this.scratch, {
        recursive: true,
        filter: filename =>
          !path
            .relative(source, filename)
            .split(path.sep)
            .some(part =>
              ['node_modules', '.rspress', 'doc_build', 'dist'].includes(part),
            ),
      });
      const dependencies = path.join(source, 'node_modules');
      const isolatedDependencies = path.join(this.scratch, 'node_modules');
      await mkdir(isolatedDependencies);
      const entries = await readdir(dependencies).catch(error => {
        if (error.code === 'ENOENT') return [];
        throw error;
      });
      for (const entry of entries) {
        if (entry === '.cache') continue;
        const target = path.join(dependencies, entry);
        await symlink(
          target,
          path.join(isolatedDependencies, entry),
          (await stat(target)).isDirectory() ? 'dir' : 'file',
        );
      }
      directory = this.scratch;
    }
    const [port, previewPort] = await reservePorts(policy.previewPort ? 2 : 1);
    const origin = `http://127.0.0.1:${port}`;
    const environment = Object.fromEntries(
      Object.entries(process.env).filter(
        ([key]) => !key.startsWith('MIDSCENE_') && key !== 'OPENAI_API_KEY',
      ),
    );
    if (previewPort) environment.RSPRESS_E2E_PREVIEW_PORT = String(previewPort);
    if (production) {
      await new Promise<void>((resolve, reject) => {
        const build = spawn(
          process.execPath,
          [
            path.join(this.repository, 'packages/core/bin/rspress.js'),
            'build',
            ...configArgs,
          ],
          {
            cwd: directory,
            env: environment,
            stdio: ['ignore', 'pipe', 'pipe'],
          },
        );
        this.child = build;
        let output = '';
        for (const stream of [build.stdout, build.stderr])
          stream?.on('data', chunk => {
            output = (output + String(chunk)).slice(-8000);
          });
        const timeout = setTimeout(() => {
          build.kill('SIGKILL');
          reject(new Error('Production fixture build timed out'));
        }, 120_000);
        build.once('error', error => {
          clearTimeout(timeout);
          reject(error);
        });
        build.once('exit', code => {
          clearTimeout(timeout);
          code === 0
            ? resolve()
            : reject(new Error(`Production fixture build failed: ${output}`));
        });
      });
      this.child = undefined;
    }
    const child = spawn(
      process.execPath,
      [
        path.join(this.repository, 'packages/core/bin/rspress.js'),
        production ? 'preview' : 'dev',
        '--host',
        '127.0.0.1',
        '--port',
        String(port),
        ...configArgs,
      ],
      {
        cwd: directory,
        env: environment,
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );
    this.child = child;
    let log = '';
    let spawnError: Error | undefined;
    child.on('error', error => {
      spawnError = error;
    });
    for (const stream of [child.stdout, child.stderr]) {
      stream?.on('data', chunk => {
        log = (log + String(chunk)).slice(-8000);
      });
    }
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      if (spawnError || child.exitCode !== null || child.signalCode !== null) {
        this.child = undefined;
        throw new Error(
          `Fixture ${fixture} failed to start: ${spawnError?.message ?? log}`,
        );
      }
      try {
        const response = await fetch(origin + policy.readyPath, {
          signal: AbortSignal.timeout(1000),
        });
        if (response.status < 500) {
          this.fixture = fixture;
          this.production = production;
          this.origin = origin;
          return origin;
        }
      } catch {
        /* The server is not ready yet. */
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    await this.close();
    throw new Error(`Fixture ${fixture} readiness timed out: ${log}`);
  }

  async update(part: FixtureUpdatePart): Promise<void> {
    const mutation = fixtureMutations[part];
    if (
      !this.scratch ||
      !this.scratchRoot ||
      !mutation.fixtures.some(name => name === this.fixture)
    )
      throw new Error('Open the matching isolated HMR fixture first');
    const [relative, before, after] = mutation.change;
    const filename = path.join(this.scratch, relative);
    const content = await readFile(filename, 'utf8');
    if (!content.includes(before))
      throw new Error(`HMR fixture no longer contains ${before}`);
    // Stage outside the watched document root: add/unlink events restart the server.
    // Atomic replacement also avoids compiling a partially written source file.
    const pending = path.join(this.scratchRoot, 'midscene-update-pending');
    try {
      await writeFile(pending, content.replace(before, after));
      await rename(pending, filename);
    } finally {
      await rm(pending, { force: true });
    }
  }

  async close(): Promise<void> {
    const child = this.child;
    this.child = undefined;
    this.fixture = undefined;
    this.origin = undefined;
    if (isRunning(child))
      await new Promise<void>((resolve, reject) => {
        const forceKill = setTimeout(() => child.kill('SIGKILL'), 5000);
        const deadline = setTimeout(() => {
          child.off('exit', onExit);
          reject(
            new Error(
              `Fixture process ${child.pid} did not exit after SIGKILL`,
            ),
          );
        }, 10_000);
        const onExit = () => {
          clearTimeout(forceKill);
          clearTimeout(deadline);
          resolve();
        };
        child.once('exit', onExit);
        child.kill('SIGTERM');
      });
    if (this.scratchRoot) {
      const scratchRoot = this.scratchRoot;
      this.scratchRoot = undefined;
      this.scratch = undefined;
      await rm(scratchRoot, { recursive: true, force: true });
    }
  }
}
