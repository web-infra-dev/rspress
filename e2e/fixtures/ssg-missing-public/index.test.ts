import { expect, test } from '@playwright/test';
import { runBuildCommand } from '../../utils/runCommands';

test('should reject when template public assets are missing', async () => {
  const appDir = import.meta.dirname;
  await expect(runBuildCommand(appDir)).rejects.toBeInstanceOf(Error);
});
