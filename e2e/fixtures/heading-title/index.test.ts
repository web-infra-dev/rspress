import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('heading-title test', async () => {
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

  test('Guide page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');

    // check style font-size
    const fontSize = await h1.evaluate(node => {
      return window.getComputedStyle(node).fontSize;
    });
    expect(fontSize).toBe('2rem');

    // check anchor #heading-title should be in h1
    const anchor = h1.locator('a.header-anchor');
    await expect(anchor).toHaveAttribute('href', '#heading-title');
  });
});
