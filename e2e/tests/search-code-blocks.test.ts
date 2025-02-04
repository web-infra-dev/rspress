import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';
import { searchInPage } from '../utils/search';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('search code blocks test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'search-code-blocks');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('search index should include content of code blocks', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`);
    const suggestItems = await searchInPage(page, 'hello from code block');
    expect(suggestItems.length).toBe(1);
  });
});
