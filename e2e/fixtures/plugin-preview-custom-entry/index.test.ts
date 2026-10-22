import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin preview with custom entries', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('preserves three custom-entry preview containers', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = page.locator('.rspress-doc > .rp-preview');
    await expect(codeBlockElements).toHaveCount(3);
    await expect(page.locator('iframe')).toHaveCount(3);
  });
});
