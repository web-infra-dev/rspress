import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('theme-css-order', async () => {
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

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const link = await page.$('.rspress-doc a');
    const colorValue = await link?.evaluate(
      element => getComputedStyle(element).color,
    );
    expect(colorValue).toEqual('rgb(255, 165, 0)');
  });
});
