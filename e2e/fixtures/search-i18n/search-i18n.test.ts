import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';
import { searchInPage } from '../../utils/search';

test.describe('search i18n test', async () => {
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

  test('should update search index when language changed', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    const suggestItems1 = await searchInPage(page, 'Button');
    expect(await suggestItems1[0].textContent()).toContain('Button en');

    // close the search modal
    await page.click('body');

    // Switch language to Chinese
    await page.click('.rspress-nav-menu-group-button');
    await page.click('.rspress-nav-menu-group-content a');
    await page.waitForLoadState();

    const suggestItems2 = await searchInPage(page, 'Button');
    expect(await suggestItems2[0].textContent()).toContain('Button 中文');
    await page.click('body');

    // Switch language to English
    await page.click('.rspress-nav-menu-group-button');
    await page.click('.rspress-nav-menu-group-content a');
    await page.waitForLoadState();

    const suggestItems3 = await searchInPage(page, 'Button');
    expect(await suggestItems3[0].textContent()).toContain('Button en');
  });
});
