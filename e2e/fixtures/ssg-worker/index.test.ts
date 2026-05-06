import { test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('build with experimental SSG worker', async () => {
  const appDir = import.meta.dirname;
  await runBuildCommand(appDir);
});
