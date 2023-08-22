import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should add routes', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/filepath-route`, {
      waitUntil: 'networkidle',
    });

    let h1 = await page.$('h1');
    let text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Demo1');

    await page.goto(`http://localhost:${appPort}/content-route`, {
      waitUntil: 'networkidle',
    });

    h1 = await page.$('h1');
    text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('Demo2');
  });
});
