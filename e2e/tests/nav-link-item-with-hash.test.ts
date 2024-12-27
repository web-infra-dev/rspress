import { expect, test } from '@playwright/test';
import path from 'node:path';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('basic test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'nav-link-item-with-hash');
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
    expect(page.url()).toContain('index#pageA');

    await page.locator('.rspress-nav-menu a').nth(1).click();
    expect(page.url()).toContain('index#pageB');
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

  test('Navbar should be visible on mobile when we scroll down with hideNavbar to never', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`);

    await page.evaluate(() => {
      window.scrollBy(0, 800);
    });

    // Allow to check if the rspress-nav is in the viewport
    // toBeVisible() doesn't work here because it check the visibility and the display property
    const isInViewport = await page.evaluate(sel => {
      const element = document.querySelector(sel);

      if (!element) return false;

      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <=
          (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <=
          (window.innerWidth || document.documentElement.clientWidth)
      );
    }, '.rspress-nav');

    expect(isInViewport).toBeTruthy();
  });
});
