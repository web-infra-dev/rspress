import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('title-number test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'title-number');
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
    const h3 = await page.$$('h3');
    const textList = await page.evaluate(h3 => h3.map(h => h.textContent), h3);

    expect(textList).toEqual(['#-22222222', '#-1111111111', '#-1111111111']);

    const h3A = await page.$$('h3 a');
    const hrefList = await page.evaluate(
      h3A => h3A.map(h => h?.getAttribute('href')),
      h3A,
    );

    expect(hrefList).toEqual(['#-22222222', '#-1111111111', '#-1111111111-1']);
  });
});
