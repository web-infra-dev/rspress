import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('home footer test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('custom home footer', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('a')).toBeVisible();
  });
});
