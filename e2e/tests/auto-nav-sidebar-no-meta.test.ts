import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('Auto nav and sidebar test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'auto-nav-sidebar-no-meta');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/api/`, {
      waitUntil: 'networkidle',
    });

    // take the sidebar, properly a section or a tag
    const sidebar = await page.$$(
      `.rspress-sidebar .rspress-scrollbar > nav > section,
      .rspress-sidebar .rspress-scrollbar > nav > a`,
    );
    expect(sidebar?.length).toBe(3);
    const sidebarTexts = await Promise.all(
      sidebar.map(element => element.textContent()),
    );
    expect(sidebarTexts.join(',')).toEqual(
      [
        'API',
        'Commands',
        'configBasic ConfigBuild ConfigFront Matter ConfigTheme Config',
      ].join(','),
    );
  });

  test('Should click the directory and navigate to the index page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index`, {
      waitUntil: 'networkidle',
    });

    const ele = page.locator('h2 span');

    expect(await ele.textContent()).toBe('config');
    await ele.click();
    expect(page.url()).toBe(
      `http://localhost:${appPort}/api/rspress-config.html`,
    );
  });
});
