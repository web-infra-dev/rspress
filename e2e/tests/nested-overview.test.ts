import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Nested overview page', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'nested-overview');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should load nested overview page correctly - level 1', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['Level 2'].join(','));

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['Level 2', 'two', 'Level 3'].join(','));
  });

  test('Should load nested overview page correctly - level 2', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/level-2/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['two', 'Level 3'].join(','));

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['two', 'Level 3', 'three'].join(','));
  });

  test('Should load nested overview page correctly - level 3', async ({
    page,
  }) => {
    await page.goto(
      `http://localhost:${appPort}/base-url/basic-level-1/level-2/level-3/index.html`,
      {
        waitUntil: 'networkidle',
      },
    );

    const h2 = await page.$$('.overview-index h2');
    const h2Texts = await Promise.all(h2.map(element => element.textContent()));
    expect(h2Texts.join(',')).toEqual(['three'].join(','));

    const h3 = await page.$$('.overview-group_f8331 h3');
    const h3Texts = await Promise.all(h3.map(element => element.textContent()));
    expect(h3Texts.join(',')).toEqual(['three'].join(','));
  });
});
