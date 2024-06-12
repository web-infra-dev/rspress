import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('tabs-component test', async () => {
  let appPort;
  let app;

  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'tabs-component');
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

    // Tab A
    const tabA = await page.$('.tabs-a');
    const contentA = await page.$('.tabs-a + div');
    const tabAText = await page.evaluate(node => node?.innerHTML, tabA);
    const contentAText = await page.evaluate(node => node?.innerHTML, contentA);
    expect(tabAText).toContain('label1');
    expect(contentAText).toContain('content1');

    // Tab B
    const tabB = await page.$('.tabs-b');
    const contentB = await page.$('.tabs-b + div');
    const tabBText = await page.evaluate(node => node?.innerHTML, tabB);
    const contentBText = await page.evaluate(node => node?.innerHTML, contentB);
    expect(tabBText).toContain('label2');
    expect(contentBText).toContain('content2');
    const notSelected = await page.$$eval(
      '.tabs-b div',
      divs => divs.filter(div => div.className.includes('not-selected')).length,
    );
    expect(notSelected).toEqual(2);

    // Tab C
    const tabC = await page.$('.tabs-c');
    const contentC = await page.$('.tabs-c + div');
    const tabCText = await page.evaluate(node => node?.innerHTML, tabC);
    const contentCText = await page.evaluate(node => node?.innerHTML, contentC);
    expect(tabCText).toEqual('');
    expect(contentCText).toEqual('');
  });
});
