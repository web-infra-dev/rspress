import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';
import { searchInPage } from '../utils/search';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('api-docgen test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-api-docgen');
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
    const table = await page.$('table');
    const tableContent = await page.evaluate(table => table?.innerHTML, table);

    // Property
    expect(tableContent).toContain('Property');
    expect(tableContent).toContain('disabled');
    expect(tableContent).toContain('size');

    // Description
    expect(tableContent).toContain('Description');
    expect(tableContent).toContain('Whether to disable the button');
    expect(tableContent).toContain('- This is extra line a');
    expect(tableContent).toContain('- This is extra line b');
    expect(tableContent).toContain('Type of Button');

    // Type
    expect(tableContent).toContain('Type');
    expect(tableContent).toContain('boolean');
    expect(tableContent).toContain('"mini" | "small" | "default" | "large"');

    // Default Value
    expect(tableContent).toContain('Default Value');
    expect(tableContent).toContain('-');
    expect(tableContent).toContain("'default'");
  });

  test('search index should include api-docgen result', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const suggestItems = await searchInPage(page, 'disabled');
    expect(suggestItems.length).toBe(1);
  });
});
