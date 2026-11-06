import type { ChildProcess } from 'node:child_process';
import { EventEmitter } from 'node:events';
import { beforeEach, expect, rs, test } from '@rstest/core';
import spawn from 'cross-spawn';
import { runNpmScript } from './runCommands';

rs.mock('cross-spawn', () => ({ default: rs.fn() }));

let child: ChildProcess;
const options = { appDir: import.meta.dirname, env: {} };

beforeEach(() => {
  rs.clearAllMocks();
  child = Object.assign(new EventEmitter(), {
    pid: 123,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
  }) as unknown as ChildProcess;
  rs.mocked(spawn).mockReturnValue(child);
});

test('waits for successful build exit even after a size report', async () => {
  let completed = false;
  const build = runNpmScript('build', options).then(() => {
    completed = true;
  });
  child.stdout!.emit('data', Buffer.from('File (web)\n'));
  await new Promise(resolve => setImmediate(resolve));
  const completedBeforeExit = completed;
  child.emit('close', 0, null);
  await build;
  expect(completedBeforeExit).toBe(false);
});

test('rejects a build that fails after printing its size report', async () => {
  const build = runNpmScript('build', options);
  child.stdout!.emit('data', Buffer.from('File (web)\n'));
  child.stderr!.emit('data', Buffer.from('afterBuild failed'));
  child.emit('close', 1, null);
  await expect(build).rejects.toThrow('afterBuild failed');
});

for (const [command, chunks] of [
  ['dev', ['ready built ', 'in 1s']],
  ['preview', ['  Lo', 'cal: http://localhost:3000']],
] as const) {
  test(`recognizes ${command} readiness split across stdout chunks`, async () => {
    const started = runNpmScript(command, options);
    for (const chunk of chunks) child.stdout!.emit('data', Buffer.from(chunk));
    await new Promise(resolve => setImmediate(resolve));
    const result = await Promise.race([started, Promise.resolve('pending')]);
    child.emit('close', 0, null);
    await started.catch(() => {});
    expect(result).toBe(child);
  });

  test(`rejects ${command} exit before readiness even with exit code zero`, async () => {
    const started = runNpmScript(command, options);
    child.stderr!.emit('data', Buffer.from('server did not start'));
    child.emit('close', 0, null);
    await expect(started).rejects.toThrow('server did not start');
  });
}
