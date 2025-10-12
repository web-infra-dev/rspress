import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('tabs-component test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;

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

    await page.waitForSelector('.rp-tabs__tab');
    const tabs = page.locator('.rp-tabs__tab');
    const tabsText = (await tabs.allInnerTexts()).map(text => text.trim());

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

    const clickTabs = tabs;
    const getCommands = async () =>
      (await page.locator('.rp-codeblock_content code').allInnerTexts()).map(
        text => text.trim(),
      );

    await clickTabs.nth(0).click();
    expect(await getCommands()).toEqual([
      'npm create rspress@latest',
      'npm install rspress -D',
      'npx example-cli-tool --yes',
    ]);

    await clickTabs.nth(1).click();
    expect(await getCommands()).toEqual([
      'yarn create rspress',
      'yarn add rspress -D',
      'yarn example-cli-tool --yes',
    ]);

    await clickTabs.nth(2).click();
    expect(await getCommands()).toEqual([
      'pnpm create rspress@latest',
      'pnpm add rspress -D',
      'pnpm example-cli-tool --yes',
    ]);

    await clickTabs.nth(3).click();
    expect(await getCommands()).toEqual([
      'bun create rspress@latest',
      'bun add rspress -D',
      'bun example-cli-tool --yes',
    ]);
  });
});
