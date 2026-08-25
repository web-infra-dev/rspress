import { expect, test } from '@e2e/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('navigation links with hashes', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

  test('Navigate with an hash as link', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('.rp-nav-menu__item a').first().click();
    expect(page.url()).toContain('/#pageA');

    await page.locator('.rp-nav-menu__item a').nth(1).click();
    expect(page.url()).toContain('/#pageB');
  });

  test('Scrolls to the hash after the target layout is ready', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto(`http://localhost:${appPort}/source`, {
      waitUntil: 'networkidle',
    });

    await page.getByRole('link', { name: 'Target section' }).click();
    await expect(page).toHaveURL(/\/target#target-heading$/);

    const headingOffset = await page.locator('#target-heading').evaluate(el => {
      const scrollPaddingTop = Number.parseFloat(
        getComputedStyle(document.documentElement).scrollPaddingTop,
      );
      return Math.abs(el.getBoundingClientRect().top - scrollPaddingTop);
    });
    expect(headingOffset).toBeLessThanOrEqual(1);
  });

  test('Close the hamburger menu when clicking on an item in mobile view', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await page.locator('.rp-nav-hamburger').first().click();
    const navScreen = page.locator('.rp-nav-screen');
    await expect(navScreen).toHaveClass(/rp-nav-screen--open/);

    await page.getByRole('link', { name: 'PageC' }).click();
    expect(await navScreen.isVisible()).toBe(false);
  });
});
