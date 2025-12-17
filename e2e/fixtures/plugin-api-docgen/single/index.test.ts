import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runDevCommand,
} from '../../../utils/runCommands';
import { searchInPage } from '../../../utils/search';

test.describe('api-docgen test', async () => {
  let appPort: number;
  let app: unknown;

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

  test('zh/index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/zh/`, {
      waitUntil: 'networkidle',
    });
    await page.waitForSelector('.rspress-plugin-api-docgen table');
    const tableH3 = page.locator('#button');
    await expect(tableH3).toBeVisible();

    const table = page.locator('.rspress-plugin-api-docgen table');

    // Property (Chinese)
    await expect(table).toContainText('属性');
    await expect(table).toContainText('disabled');
    await expect(table).toContainText('size');

    // Description (Chinese)
    await expect(table).toContainText('说明');
    await expect(table).toContainText('Whether to disable the button');
    await expect(table).toContainText('- This is extra line a');
    await expect(table).toContainText('- This is extra line b');
    await expect(table).toContainText('Type of Button');

    // Type (Chinese)
    await expect(table).toContainText('类型');
    await expect(table).toContainText('boolean');
    await expect(table).toContainText('"mini" | "small" | "default" | "large"');

    // Default Value (Chinese)
    await expect(table).toContainText('默认值');
    await expect(table).toContainText('-');
    await expect(table).toContainText("'default'");
  });

  test('search index should include api-docgen result', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const suggestItems = await searchInPage(page, 'disabled');
    expect(suggestItems.length).toBe(1);
  });
});
