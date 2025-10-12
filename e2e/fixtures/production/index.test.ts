import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    await runBuildCommand(appDir);
    app = await runPreviewCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('check whether the page can be interacted', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const darkModeButton = page.locator('.rp-switch-appearance');
    const html = page.locator('html');
    const htmlClass = await html.getAttribute('class');
    const defaultMode = htmlClass?.includes('rp-dark') ? 'dark' : 'light';
    await darkModeButton.click();
    // check the class in html
    const newHtmlClass = await html.getAttribute('class');
    expect(newHtmlClass?.includes('rp-dark')).toBe(defaultMode !== 'dark');
  });
});
