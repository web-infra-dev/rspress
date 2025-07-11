import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('basic test', async () => {
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

  test('Navigate with an hash as link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`);

    await page.locator('.rspress-nav-menu a').first().click();
    expect(page.url()).toContain('/#pageA');

    await page.locator('.rspress-nav-menu a').nth(1).click();
    expect(page.url()).toContain('/#pageB');
  });

  test('Close the hamburger menu when clicking on an item in mobile view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`);

    await page.locator('.rspress-mobile-hamburger').click();
    await expect(page.locator('.rspress-nav-screen')).toBeVisible();

    await page.getByRole('link', { name: 'PageC' }).click();
    await expect(page.locator('.rspress-nav-screen')).not.toBeVisible();
  });
});
