import { expect, test } from '@playwright/test';
import path from 'path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render nav and sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // take the nav
    const nav = await page.$$('.rspress-nav-menu');
    expect(nav?.length).toBe(1);

    // take the sidebar, properly a section or a tag
    const sidebar = await page.$$(
      `.rspress-sidebar .rspress-scrollbar > nav > section,
      .rspress-sidebar .rspress-scrollbar > nav > a`,
    );
    expect(sidebar?.length).toBe(2);
  });
});
