import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'modern-js');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Basic', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/general/button`, {
      waitUntil: 'networkidle',
    });
    const h1 = await page.getByRole('heading', {
      name: /Button/,
    });
    expect(h1).toBeTruthy();
  });
});
