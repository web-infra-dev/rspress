import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

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
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
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
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const socialLinks = page.locator('.rp-social-links').first();
    await socialLinks.hover();
    await expect(
      page.locator('.rp-social-links__item a[href="/zh"]').first(),
    ).toBeVisible();
  });

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const link = page.locator('.rp-doc a').first();
    await expect(link).toHaveCSS('color', 'rgb(255, 165, 0)');
  });
});

test.describe('SSG dark mode no flash', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

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

  test('dark mode should be applied before hydration (no flash)', async ({
    page,
  }) => {
    // Step 1: Navigate to page and set dark mode preference
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Click appearance toggle to enable dark mode
    const appearanceToggle = page.locator('.rp-switch-appearance').first();
    await appearanceToggle.click();

    // Wait for dark mode to be applied and saved to localStorage
    await expect(page.locator('html')).toHaveClass(/rp-dark/);

    // Step 2: Reload page and check if dark class is applied early
    // Use 'domcontentloaded' to capture state after inline script runs
    // but potentially before React hydration completes
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Check dark class immediately after DOM is ready
    // If inline script works correctly, dark class should already be present
    const isDarkOnDOMReady = await page.evaluate(() =>
      document.documentElement.classList.contains('rp-dark'),
    );

    expect(isDarkOnDOMReady).toBe(true);

    // Step 3: Wait for full hydration and verify dark mode persists
    await page.waitForLoadState('networkidle');
    const isDarkAfterHydration = await page.evaluate(() =>
      document.documentElement.classList.contains('rp-dark'),
    );

    expect(isDarkAfterHydration).toBe(true);
  });

  test('light mode should be applied before hydration (no flash)', async ({
    page,
  }) => {
    // Step 1: Navigate to page and ensure light mode
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Ensure we're in light mode (click toggle if currently dark)
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains('rp-dark'),
    );
    if (isDark) {
      const appearanceToggle = page.locator('.rp-switch-appearance').first();
      await appearanceToggle.click();
      await expect(page.locator('html')).not.toHaveClass(/rp-dark/);
    }

    // Step 2: Reload and check early state
    await page.reload({ waitUntil: 'domcontentloaded' });

    const isDarkOnDOMReady = await page.evaluate(() =>
      document.documentElement.classList.contains('rp-dark'),
    );

    expect(isDarkOnDOMReady).toBe(false);

    // Step 3: Verify after hydration
    await page.waitForLoadState('networkidle');
    const isDarkAfterHydration = await page.evaluate(() =>
      document.documentElement.classList.contains('rp-dark'),
    );

    expect(isDarkAfterHydration).toBe(false);
  });
});
