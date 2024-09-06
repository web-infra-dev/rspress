import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('home footer test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'custom-home-footer');
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
    const footer = await page.$('footer');
    expect(footer).not.toBeNull();
    if (!footer) {
      return;
    }
    const a = await footer.$('a');
    expect(a).not.toBeNull();
  });
});
