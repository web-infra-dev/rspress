import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('theme-css-order', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | null;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
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

  test('doc tables should keep a minimum cell width', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const cell = page.locator('.rspress-doc table td').first();
    const headerCell = page.locator('.rspress-doc table th').first();

    await expect(cell).toHaveCSS('min-width', '150px');
    await expect(headerCell).toHaveCSS('min-width', '150px');
  });
});
