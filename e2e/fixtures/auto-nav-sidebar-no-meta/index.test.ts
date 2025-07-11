import { expect, test } from '@playwright/test';
import { getSidebarTexts } from '../../utils/getSideBar';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Auto nav and sidebar test', async () => {
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

  test('Should render sidebar correctly', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const sidebarTexts = await getSidebarTexts(page);
    expect(sidebarTexts.length).toBe(2);
    expect(sidebarTexts.join(',')).toEqual(
      [
        'API',
        'pluginPlugin aPlugin b',
        'Commands',
        'configBasic configBuild configFront matter configTheme config,',
        'HomePage',
      ].join(''),
    );
  });

  test('Should click the directory and navigate to the index page', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/api/index`, {
      waitUntil: 'networkidle',
    });

    const elements = await page.$$('h2 span');
    expect(elements.length).toBe(3);

    const configDir = elements[2];
    expect(await configDir.textContent()).toBe('config');
    await configDir.click();
    expect(page.url()).toBe(
      `http://localhost:${appPort}/api/rspress-config/index.html`,
    );
  });
});
