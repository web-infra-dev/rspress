import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../utils/getSideBar';
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

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(4);
    expect(sidebarTexts.join(',')).toEqual(
      [
        'API',
        'pluginPlugin aPlugin b',
        'Commands',
        'configBasic configBuild configFront matter configTheme config',
      ].join(','),
    );
  });

  test('Should click the directory and navigate to the index page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index`, {
      waitUntil: 'networkidle',
    });

    const elements = await page.$$('h2 span');

    const configDir = elements[1];
    expect(await configDir.textContent()).toBe('config');
    await configDir.click();
    expect(page.url()).toBe(
      `http://localhost:${appPort}/api/rspress-config.html`,
    );
  });
});
