import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('custom layout ui switch', async () => {
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
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const elementExists = (await page.$('.rspress-nav')) !== null;
    expect(elementExists).toEqual(false);
  });
});
