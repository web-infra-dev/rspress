import path from 'node:path';
import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test('ssg-fail-strict test', async () => {
  const appDir = path.join(fixtureDir, 'ssg-fail-strict');
  try {
    await runBuildCommand(appDir);
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
  }
});

test('csr should be successful', async () => {
  const appDir = path.join(fixtureDir, 'ssg-fail-strict');
  await runBuildCommand(appDir, 'rspress-csr.config.ts');
});
