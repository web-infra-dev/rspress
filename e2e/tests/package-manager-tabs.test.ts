import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('tabs-component test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'package-manager-tabs');
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
    ]);

    const clickTabs = await page.$$('[class^="tab_"]');

    await clickTabs[0].click();
    const npmSpanElements = await page.$$('code > span > span');
    const npmCode = await Promise.all(
      npmSpanElements.map(element => element.textContent()),
    );
    expect(npmCode).toEqual([
      'npm create rspress@latest',
      'npm install rspress ',
      '-',
      'D',
    ]);

    await clickTabs[1].click();
    const yarnSpanElements = await page.$$('code > span > span');
    const yarnCode = await Promise.all(
      yarnSpanElements.map(element => element.textContent()),
    );
    expect(yarnCode).toEqual([
      'yarn create rspress',
      'yarn add rspress ',
      '-',
      'D',
    ]);

    await clickTabs[2].click();
    const pnpmSpanElements = await page.$$('code > span > span');
    const pnpmCode = await Promise.all(
      pnpmSpanElements.map(element => element.textContent()),
    );
    expect(pnpmCode).toEqual([
      'pnpm create rspress@latest',
      'pnpm install rspress ',
      '-',
      'D',
    ]);

    await clickTabs[3].click();
    const bunSpanElements = await page.$$('code > span > span');
    const bunCode = await Promise.all(
      bunSpanElements.map(element => element.textContent()),
    );
    expect(bunCode).toEqual([
      'bun create rspress@latest',
      'bun add rspress ',
      '-',
      'D',
    ]);
  });
});
