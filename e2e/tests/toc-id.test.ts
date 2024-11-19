import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('custom-id test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'toc-id');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('should generate correct toc id and header anchor', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const anchors = await page.$$('.header-anchor');
    const anchorsHref = await Promise.all(
      anchors.map(anchor => anchor.getAttribute('href')),
    );
    expect(anchorsHref).toEqual([
      '#guide',
      '#custom-id',
      '#title-2',
      '#title-2-1',
      '#title-2-2',
      '#title-2-3',
      '#title-2-4',
      '#title-2-5',
    ]);

    const asides = await page.$$('.aside-link');
    const asidesHref = await Promise.all(
      asides.map(aside => aside.getAttribute('href')),
    );
    expect(asidesHref).toEqual([
      '#custom-id',
      '#title-2',
      '#title-2-1',
      '#title-2-2',
      '#title-2-3',
      '#title-2-4',
      '#title-2-5',
    ]);
  });
});
