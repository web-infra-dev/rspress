import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('package manager tabs', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await page.waitForSelector('.rp-tabs__label__item');
    const standardCommands = page.getByTestId('standard-commands');
    const tabs = standardCommands.locator('.rp-tabs__label__item');
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
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
    ]);

    const clickTabs = tabs;
    const getCommands = async () =>
      (
        await standardCommands
          .locator('.rp-codeblock__content code')
          .filter({ visible: true })
          .allInnerTexts()
      ).map(text => text.trim());

    await clickTabs.nth(0).click();
    expect(await getCommands()).toEqual([
      'npm create rspress@latest',
      'npm install -D @rspress/core',
      'npx example-cli-tool --yes',
      'npx skills add rstackjs/agent-skills --skill migrate-to-rstest',
      'npx example-cli-tool --yes',
      'npm create rspress@latest',
    ]);

    await clickTabs.nth(1).click();
    expect(await getCommands()).toEqual([
      'yarn create rspress',
      'yarn add -D @rspress/core',
      'yarn dlx example-cli-tool --yes',
      'yarn dlx skills add rstackjs/agent-skills --skill migrate-to-rstest',
      'yarn example-cli-tool --yes',
      'yarn create rspress',
    ]);

    await clickTabs.nth(2).click();
    expect(await getCommands()).toEqual([
      'pnpm create rspress@latest',
      'pnpm add -D @rspress/core',
      'pnpm dlx example-cli-tool --yes',
      'pnpm dlx skills add rstackjs/agent-skills --skill migrate-to-rstest',
      'pnpm example-cli-tool --yes',
      'pnpm create rspress@latest',
    ]);

    await clickTabs.nth(3).click();
    expect(await getCommands()).toEqual([
      'bun create rspress@latest',
      'bun add -D @rspress/core',
      'bunx example-cli-tool --yes',
      'bunx skills add rstackjs/agent-skills --skill migrate-to-rstest',
      'bun example-cli-tool --yes',
      'bun create rspress@latest',
    ]);

    await clickTabs.nth(4).click();
    expect(await getCommands()).toEqual([
      'deno init --npm rspress@latest',
      'deno add -D npm:@rspress/core',
      'deno run -A npm:example-cli-tool --yes',
      'deno run -A npm:skills add rstackjs/agent-skills --skill migrate-to-rstest',
      'deno run -A npm:example-cli-tool --yes',
      'deno init --npm rspress@latest',
    ]);
  });

  test('additional tabs display custom commands and preserve generated commands', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const fixture = page.getByTestId('additional-commands');
    const tabs = fixture.locator('.rp-tabs__label__item');
    const command = fixture
      .locator('.rp-codeblock__content code')
      .filter({ visible: true });

    await expect(tabs).toHaveText([
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'custom',
      'legacy',
    ]);

    await tabs.getByText('custom', { exact: true }).click();
    await expect(command).toHaveText('custom add --dev @rspress/core');

    await tabs.getByText('legacy', { exact: true }).click();
    await expect(command).toHaveText('legacy install -D @rspress/core');

    await tabs.getByText('npm', { exact: true }).click();
    await expect(command).toHaveText('npm install -D @rspress/core');

    await tabs.getByText('pnpm', { exact: true }).click();
    await expect(command).toHaveText('pnpm add -D @rspress/core');
  });

  test('additional tabs work with object commands and preserve literal commands', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const fixture = page.getByTestId('additional-object-commands');
    const tabs = fixture.locator('.rp-tabs__label__item');
    const command = fixture
      .locator('.rp-codeblock__content code')
      .filter({ visible: true });

    await expect(tabs).toHaveText(['npm', 'custom']);

    await tabs.getByText('custom', { exact: true }).click();
    await expect(command).toHaveText(
      'corepack pnpm install --save-dev @rspress/core',
    );

    await tabs.getByText('npm', { exact: true }).click();
    await expect(command).toHaveText('npm install -D @rspress/core');
  });

  test('additional commands are not transformed by execution mode', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const fixture = page.getByTestId('additional-execution-commands');
    const tabs = fixture.locator('.rp-tabs__label__item');
    const command = fixture
      .locator('.rp-codeblock__content code')
      .filter({ visible: true });

    await expect(tabs).toHaveText([
      'npm',
      'yarn',
      'pnpm',
      'bun',
      'deno',
      'custom',
    ]);

    await tabs.getByText('custom', { exact: true }).click();
    await expect(command).toHaveText(
      'corepack pnpm exec example-cli-tool --yes',
    );

    await tabs.getByText('npm', { exact: true }).click();
    await expect(command).toHaveText('npx example-cli-tool --yes');
  });
});
