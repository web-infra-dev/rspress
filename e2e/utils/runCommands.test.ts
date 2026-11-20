import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, test } from '@rstest/core';
import {
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from './runCommands';

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map(dir => rm(dir, { recursive: true, force: true })),
  );
});

async function createFixture(source: string) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'rspress-run-command-'));
  directories.push(dir);
  await writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({
      scripts: {
        build: 'node fixture.mjs',
        dev: 'node fixture.mjs',
        preview: 'node fixture.mjs',
      },
    }),
  );
  await writeFile(path.join(dir, 'fixture.mjs'), source);
  return dir;
}

test('waits for build completion after a file summary is logged', async () => {
  const dir = await createFixture(`
    import { writeFile } from 'node:fs/promises';
    import { setTimeout } from 'node:timers/promises';
    console.log('File web summary');
    await setTimeout(100);
    await writeFile('built.txt', 'complete');
  `);

  await runBuildCommand(dir);
  expect(await readFile(path.join(dir, 'built.txt'), 'utf8')).toBe('complete');
});

test('rejects a build failure after a file summary with its stderr', async () => {
  const dir = await createFixture(`
    import { setTimeout } from 'node:timers/promises';
    console.log('File web summary');
    await setTimeout(100);
    console.error('late build failure');
    process.exitCode = 1;
  `);

  await expect(runBuildCommand(dir)).rejects.toThrow('late build failure');
});

test('rejects a preview process that exits before it is ready', async () => {
  const dir = await createFixture(
    `console.error('preview stopped before listening');`,
  );

  await expect(runPreviewCommand(dir, 4173)).rejects.toThrow(
    'preview stopped before listening',
  );
});

test('recognizes preview startup across stdout chunks', async () => {
  const dir = await createFixture(`
    import { setTimeout } from 'node:timers/promises';
    process.stdout.write('Loc');
    await setTimeout(50);
    console.log('al: http://localhost:4173/');
    await setTimeout(100);
  `);

  const instance = await runPreviewCommand(dir, 4173);
  try {
    expect(instance).not.toBeNull();
  } finally {
    await killProcess(instance);
  }
});

test('assigns independent iframe ports to concurrent dev processes', async () => {
  const source = `
    import { writeFile } from 'node:fs/promises';
    import { setTimeout } from 'node:timers/promises';
    await writeFile('port.txt', process.env.RSPRESS_E2E_PREVIEW_PORT ?? 'missing');
    console.log('built in 1ms');
    await setTimeout(100);
  `;
  const dirs = await Promise.all([
    createFixture(source),
    createFixture(source),
  ]);
  const instances = await Promise.all(
    dirs.map(dir => runDevCommand(dir, 4173)),
  );
  try {
    const ports = await Promise.all(
      dirs.map(dir => readFile(path.join(dir, 'port.txt'), 'utf8')),
    );
    expect(ports[0]).toMatch(/^\d+$/);
    expect(ports[1]).toMatch(/^\d+$/);
    expect(ports[0]).not.toBe(ports[1]);
  } finally {
    await Promise.all(instances.map(instance => killProcess(instance)));
  }
});
