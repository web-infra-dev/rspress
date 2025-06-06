import assert from 'node:assert';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('search code blocks test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'search-algolia');
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

    const searchButton = await page.$('.DocSearch.DocSearch-Button');
    assert(searchButton);
    await searchButton.click();

    const searchBar = await page.$('.DocSearch-SearchBar');
    expect(await searchBar?.isVisible()).toBeTruthy();
  });
});
