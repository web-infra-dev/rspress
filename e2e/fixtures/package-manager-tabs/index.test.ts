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

    await page.waitForSelector('.rp-tabs__label__item');
    const tabs = page.locator('.rp-tabs__label__item');
    const tabsText = (await tabs.allInnerTexts()).map(text => text.trim());

    expect(tabsText).toEqual([
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
    ]);

    const clickTabs = tabs;
    const getCommands = async () =>
      (await page.locator('.rp-codeblock__content code').allInnerTexts()).map(
        text => text.trim(),
      );

    await clickTabs.nth(0).click();
    expect(await getCommands()).toEqual([
      'npm create rspress@latest',
      'npm install -D @rspress/core',
      'npx example-cli-tool --yes',
      'npx example-cli-tool --yes',
      'npm create rspress@latest',
    ]);

    await clickTabs.nth(1).click();
    expect(await getCommands()).toEqual([
      'yarn create rspress',
      'yarn add -D @rspress/core',
      'yarn dlx example-cli-tool --yes',
      'yarn example-cli-tool --yes',
      'yarn create rspress',
    ]);

    await clickTabs.nth(2).click();
    expect(await getCommands()).toEqual([
      'pnpm create rspress@latest',
      'pnpm add -D @rspress/core',
      'pnpm dlx example-cli-tool --yes',
      'pnpm example-cli-tool --yes',
      'pnpm create rspress@latest',
    ]);

    await clickTabs.nth(3).click();
    expect(await getCommands()).toEqual([
      'bun create rspress@latest',
      'bun add -D @rspress/core',
      'bunx example-cli-tool --yes',
      'bun example-cli-tool --yes',
      'bun create rspress@latest',
    ]);

    await clickTabs.nth(4).click();
    expect(await getCommands()).toEqual([
      'deno init --npm rspress@latest',
      'deno add -D npm:@rspress/core',
      'deno run npm:example-cli-tool --yes',
      'deno run npm:example-cli-tool --yes',
      'deno init --npm rspress@latest',
    ]);
  });
});
