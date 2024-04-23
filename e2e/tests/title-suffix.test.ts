import path from 'path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const appDir = path.resolve(__dirname, '../fixtures/title-suffix');

test.describe('title suffix', async () => {
  let appPort: number;
  let app: unknown;
  test.beforeAll(async () => {
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
    await expect(await page.title()).toBe('Default Title - Index Suffix');
  });

  test('Foo page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/foo/`);
    await expect(await page.title()).toBe('Foo | Foo Suffix');
  });
});
