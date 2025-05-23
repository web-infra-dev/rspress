import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('symlink test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'symlink');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Internal Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/internal.html`);
    const anchors = await page.$$('.rspress-doc a');
    const hrefList = await page.evaluate(
      anchors => anchors.map(anchor => (anchor as HTMLAnchorElement).href),
      anchors,
    );
    expect(hrefList).toEqual([
      `http://localhost:${appPort}/internal/content.html`,
    ]);
  });
});
