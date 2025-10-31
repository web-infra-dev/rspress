import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tabs-component test', async () => {
  let appPort: number;
  let app;

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

  test('Banner close hides banner and persists state', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    await page.waitForSelector('.rp-banner');

    const closeButton = page.locator('.rp-banner__close');
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(page.locator('.rp-banner')).toHaveCount(0);
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('rp-banner-closed'),
    );
    expect(stored).toBe('true');
  });
});
