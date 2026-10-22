import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import { createServer } from 'node:net';
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  writeFile,
  symlink,
  rm,
} from 'node:fs/promises';

import {
  originalFixtures,
  fixtureAliases,
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

async function reservePorts(count: number): Promise<number[]> {
  const reservations: ReturnType<typeof createServer>[] = [];
  const ports: number[] = [];
  try {
    for (let index = 0; index < count; index++) {
      const server = createServer();
      reservations.push(server);
      ports.push(
        await new Promise<number>((resolve, reject) => {
          server.once('error', reject);
          server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            if (!address || typeof address === 'string')
              return reject(new Error('No fixture port'));
            resolve(address.port);
          });
        }),
      );
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
  constructor(repository: string) {
    this.repository = repository;
  }
  private child?: ChildProcess;
  private fixture?: string;
  private origin?: string;
  private scratch?: string;
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
    if (policy.isolated) {
      const parent = path.join(this.repository, 'tests/midscene/.fixture');
      await mkdir(parent, { recursive: true });
      this.scratch = await mkdtemp(path.join(parent, `${fixture}-`));
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
      await symlink(
        path.join(source, 'node_modules'),
        path.join(this.scratch, 'node_modules'),
        'dir',
      );
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
    if (!this.scratch || !mutation.fixtures.some(name => name === this.fixture))
      throw new Error('Open the matching isolated HMR fixture first');
    const [relative, before, after] = mutation.change;
    const filename = path.join(this.scratch, relative);
    const content = await readFile(filename, 'utf8');
    if (!content.includes(before))
      throw new Error(`HMR fixture no longer contains ${before}`);
    await writeFile(filename, content.replace(before, after));
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
    if (this.scratch) {
      const scratch = this.scratch;
      this.scratch = undefined;
      await rm(scratch, { recursive: true, force: true });
    }
  }
}
