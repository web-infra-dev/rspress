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

  test('Index page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    // Check the main heading text using modern locator API
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Hello world');

    // Verify the header anchor link is rendered with correct href
    const headerAnchor = page.locator('.header-anchor');
    await expect(headerAnchor).toHaveAttribute('href', '#hello-world');
  });

  test('404 page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/404`);

    // Wait for page to load completely
    await page.waitForLoadState('networkidle');

    // Verify 404 text is present in the page
    await expect(page.locator('body')).toContainText('404');
  });

  test('dark mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);
    await page.waitForLoadState('networkidle');

    const darkModeButton = page.locator('.rspress-nav-appearance');
    const htmlElement = page.locator('html');

    // Get initial theme mode
    const initialClass = await htmlElement.getAttribute('class');
    const defaultMode = initialClass?.includes('dark') ? 'dark' : 'light';

    // Toggle dark mode
    await darkModeButton.click();

    // Verify theme has changed
    await expect(htmlElement).toHaveClass(
      defaultMode === 'dark' ? /^(?!.*dark).*$/ : /.*dark.*/,
    );

    // Toggle back to original mode
    await darkModeButton.click();

    // Verify theme has returned to original state
    if (defaultMode === 'dark') {
      await expect(htmlElement).toHaveClass(/.*dark.*/);
    } else {
      await expect(htmlElement).toHaveClass(/^(?!.*dark).*$/);
    }
  });

  test('Hover over social links', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    // Hover over social links section
    const socialLinks = page.locator('.social-links');
    await socialLinks.hover();

    // Wait for any hover effects to complete
    await page.waitForTimeout(500);

    // Verify the logo link is present
    const logoLink = page.locator('a[href="/zh"]');
    await expect(logoLink).toBeVisible();
  });

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`);

    // Check that global styles are applied to document links
    const documentLink = page.locator('.rspress-doc a').first();
    await expect(documentLink).toHaveCSS('color', 'rgb(255, 165, 0)');
  });
});
