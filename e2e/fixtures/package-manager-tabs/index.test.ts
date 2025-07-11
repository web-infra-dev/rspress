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

    const tabs = await page.$$('[class^="tab_"] > div > span');
    const tabsText = await Promise.all(
      tabs.map(element => element.textContent()),
    );

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

    const clickTabs = await page.$$('[class^="tab_"]');

    await clickTabs[0].click();
    const npmSpanElements = await page.$$('code > span > span');
    const npmCode = await Promise.all(
      npmSpanElements.map(element => element.textContent()),
    );
    expect(npmCode).toEqual([
      'npm',
      ' create rspress@latest',
      'npm',
      ' install rspress -D',
      'npx',
      ' example-cli-tool --yes',
    ]);

    await clickTabs[1].click();
    const yarnSpanElements = await page.$$('code > span > span');
    const yarnCode = await Promise.all(
      yarnSpanElements.map(element => element.textContent()),
    );
    expect(yarnCode).toEqual([
      'yarn',
      ' create rspress',
      'yarn',
      ' add rspress -D',
      'yarn',
      ' example-cli-tool --yes',
    ]);

    await clickTabs[2].click();
    const pnpmSpanElements = await page.$$('code > span > span');
    const pnpmCode = await Promise.all(
      pnpmSpanElements.map(element => element.textContent()),
    );
    expect(pnpmCode).toEqual([
      'pnpm',
      ' create rspress@latest',
      'pnpm',
      ' add rspress -D',
      'pnpm',
      ' example-cli-tool --yes',
    ]);

    await clickTabs[3].click();
    const bunSpanElements = await page.$$('code > span > span');
    const bunCode = await Promise.all(
      bunSpanElements.map(element => element.textContent()),
    );
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
