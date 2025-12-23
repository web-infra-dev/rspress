import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('theme-css-order', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
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

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const link = page.locator('.rspress-doc a:not(.rp-header-anchor)');
    await expect(link).toHaveCSS('color', 'rgb(255, 165, 0)');
  });
});
