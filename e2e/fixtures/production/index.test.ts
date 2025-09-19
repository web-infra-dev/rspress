import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('production build test', async () => {
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
    await page.goto(`http://localhost:${appPort}`);
    await page.waitForLoadState('networkidle');

    const darkModeButton = page.locator('.rspress-nav-appearance');
    const htmlElement = page.locator('html');

    // Get initial theme mode
    const initialClass = await htmlElement.getAttribute('class');
    const defaultMode = initialClass?.includes('dark') ? 'dark' : 'light';

    // Toggle dark mode and verify the change
    await darkModeButton.click();

    // Verify theme has changed using modern assertion patterns
    if (defaultMode === 'dark') {
      // Should no longer have dark class
      await expect(htmlElement).toHaveClass(/^(?!.*dark).*$/);
    } else {
      // Should now have dark class
      await expect(htmlElement).toHaveClass(/.*dark.*/);
    }
  });
});
