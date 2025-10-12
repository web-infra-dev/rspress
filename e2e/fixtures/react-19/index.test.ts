import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('React 19 test', async () => {
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Hello world');
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: 'networkidle',
    });
    // find the 404 text in the page
    await expect(page.locator('body')).toContainText('404');
  });
});
