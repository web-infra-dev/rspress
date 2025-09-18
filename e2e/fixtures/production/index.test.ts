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

    const darkModeButton = page.locator('.rspress-nav-appearance');
    const htmlElement = page.locator('html');

    // Get initial mode
    const initialClass = await htmlElement.getAttribute('class');
    const defaultMode = initialClass?.includes('dark') ? 'dark' : 'light';

    // Click dark mode button
    await darkModeButton.click();

    // Verify the mode has toggled
    await expect(htmlElement).toHaveClass(
      defaultMode === 'dark' ? /^(?!.*dark).*$/ : /.*dark.*/,
    );
  });
});
