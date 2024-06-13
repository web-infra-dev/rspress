import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Multi version test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'multi-version');
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
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('v1');
  });

  test('Not Default version default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/v2`);
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('v2');
  });

  test('Default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/zh`);
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('v1 中文');
  });

  test('Not default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/v2/zh`);
    const h1 = await page.$('h1');
    const text = await page.evaluate(h1 => h1?.textContent, h1);
    await expect(text).toContain('v2 中文');
  });
});
