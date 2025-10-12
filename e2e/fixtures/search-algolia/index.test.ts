import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('search code blocks test', async () => {
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

  test('should search by algolia', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const searchButton = page.locator('.DocSearch.DocSearch-Button');
    await searchButton.click();

    const searchBar = page.locator('.DocSearch-SearchBar');
    await expect(searchBar).toBeVisible();
  });
});
