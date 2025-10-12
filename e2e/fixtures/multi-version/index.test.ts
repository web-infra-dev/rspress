import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Multi version test', async () => {
  let appPort;
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

  test('Default version and default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v1');
  });

  test('Not Default version default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/v2`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v2');
  });

  test('Default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/zh`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v1 中文');
  });

  test('Not default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/v2/zh`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v2 中文');
  });
});
