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
