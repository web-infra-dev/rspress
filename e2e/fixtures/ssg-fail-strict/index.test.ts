import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('ssg-fail-strict test', async () => {
  const appDir = __dirname;
  try {
    await runBuildCommand(appDir);
  } catch (err) {
    expect(err).toBeInstanceOf(Error);
  }
});

test('csr should be successful', async () => {
  const appDir = __dirname;
  await runBuildCommand(appDir, 'rspress-csr.config.ts');
});
