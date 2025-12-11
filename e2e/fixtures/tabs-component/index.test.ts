import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tabs-component test', async () => {
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    await page.waitForSelector('.tabs-a');

    // Tab A
    const tabA = page.locator('.tabs-a');
    const contentA = page.locator('.tabs-a > div').nth(1);
    await expect(tabA).toContainText('label1');
    await expect(contentA).toContainText('content1');

    // Tab B
    const tabB = page.locator('.tabs-b');
    const contentB = page.locator('.tabs-b > div').nth(1);
    await expect(tabB).toContainText('label2');
    await expect(contentB).toContainText('content2');
    const notSelected = await page
      .locator('.tabs-b div')
      .filter({ hasText: /./ })
      .evaluateAll(
        divs =>
          divs.filter(div => div.className.includes('not-selected')).length,
      );
    expect(notSelected).toEqual(2);

    // Tab C
    const tabC = page.locator('.tabs-c');
    const contentC = page.locator('.tabs-c > div');
    await expect(tabC).toHaveText('');
    await expect(contentC).toHaveText('');
  });
});
