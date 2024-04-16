import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'custom-plugin');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should add route by filepath', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/filepath-route`, {
      waitUntil: 'networkidle',
    });
    const h1 = await page.getByRole('heading', {
      name: /Demo1/,
    });
    await expect(h1).toBeTruthy();
  });

  test('Should add route by content', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/content-route`, {
      waitUntil: 'networkidle',
    });

    const h1 = await page.getByRole('heading', {
      name: /Demo2/,
    });
    await expect(h1).toBeTruthy();
  });
});
