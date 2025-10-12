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

    await page.waitForSelector('[class^="tab_"] > div > span');
    const tabs = page.locator('[class^="tab_"] > div > span');
    const tabsText = await tabs.allTextContents();

    expect(tabsText).toEqual([
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'npm',
      'yarn',
      'pnpm',
      'bun',
    ]);

    const clickTabs = page.locator('[class^="tab_"]');

    await clickTabs.nth(0).click();
    const npmSpanElements = page.locator('code > span > span');
    const npmCode = await npmSpanElements.allTextContents();
    expect(npmCode).toEqual([
      'npm',
      ' create rspress@latest',
      'npm',
      ' install rspress -D',
      'npx',
      ' example-cli-tool --yes',
    ]);

    await clickTabs.nth(1).click();
    const yarnSpanElements = page.locator('code > span > span');
    const yarnCode = await yarnSpanElements.allTextContents();
    expect(yarnCode).toEqual([
      'yarn',
      ' create rspress',
      'yarn',
      ' add rspress -D',
      'yarn',
      ' example-cli-tool --yes',
    ]);

    await clickTabs.nth(2).click();
    const pnpmSpanElements = page.locator('code > span > span');
    const pnpmCode = await pnpmSpanElements.allTextContents();
    expect(pnpmCode).toEqual([
      'pnpm',
      ' create rspress@latest',
      'pnpm',
      ' add rspress -D',
      'pnpm',
      ' example-cli-tool --yes',
    ]);

    await clickTabs.nth(3).click();
    const bunSpanElements = page.locator('code > span > span');
    const bunCode = await bunSpanElements.allTextContents();
    expect(bunCode).toEqual([
      'bun',
      ' create rspress@latest',
      'bun',
      ' add rspress -D',
      'bun',
      ' example-cli-tool --yes',
    ]);
  });
});
