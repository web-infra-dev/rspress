import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    await page.waitForSelector('.rspress-plugin-api-docgen table');
    const tableH3 = page.locator('#button');
    await expect(tableH3).toBeVisible();

    const table = page.locator('.rspress-plugin-api-docgen table');

    // Property
    await expect(table).toContainText('Property');
    await expect(table).toContainText('disabled');
    await expect(table).toContainText('size');

    // Description
    await expect(table).toContainText('Description');
    await expect(table).toContainText('Whether to disable the button');
    await expect(table).toContainText('- This is extra line a');
    await expect(table).toContainText('- This is extra line b');
    await expect(table).toContainText('Type of Button');

    // Type
    await expect(table).toContainText('Type');
    await expect(table).toContainText('boolean');
    await expect(table).toContainText('"mini" | "small" | "default" | "large"');

    // Default Value
    await expect(table).toContainText('Default Value');
    await expect(table).toContainText('-');
    await expect(table).toContainText("'default'");
  });

  test('search index should include api-docgen result', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const suggestItems = await searchInPage(page, 'disabled');
    expect(suggestItems.length).toBe(1);
  });
});
