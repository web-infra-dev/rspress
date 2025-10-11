import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('basic test', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    await expect(page.locator('h1')).toContainText('Hello world');
    const headerAnchor = page.locator('.rp-header-anchor').first();
    await expect(headerAnchor).toHaveAttribute('href', '#hello-world');
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('body')).toContainText('404');
  });

  test('dark mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const appearanceToggle = page.locator('.rp-switch-appearance').first();
    const getIsDark = () =>
      page.evaluate(() =>
        document.documentElement.classList.contains('rp-dark'),
      );
    const defaultIsDark = await getIsDark();
    await appearanceToggle.click();
    await expect.poll(getIsDark).toBe(!defaultIsDark);
    await appearanceToggle.click();
    await expect.poll(getIsDark).toBe(defaultIsDark);
  });

  test('Hover over social links', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const socialLinks = page.locator('.rp-social-links').first();
    await socialLinks.hover();
    await expect(page.locator('.rp-social-links a[href="/zh"]')).toBeVisible();
  });

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    const link = page.locator('.rp-doc a').first();
    await expect(link).toHaveCSS('color', 'rgb(255, 165, 0)');
  });
});
