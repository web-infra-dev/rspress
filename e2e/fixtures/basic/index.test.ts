import { expect, type Page, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

const CLI_BASE = '/bar/';

const getIsDark = (page: Page) =>
  page.evaluate(() => document.documentElement.classList.contains('rp-dark'));

test.describe('basic site', async () => {
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

  test('generates the Hello world header anchor href', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const headerAnchor = page.locator('.rp-header-anchor').first();
    await expect(headerAnchor).toHaveAttribute('href', '#hello-world');
  });

  test('dark mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const appearanceToggle = page.locator('.rp-switch-appearance').first();
    const defaultIsDark = await getIsDark(page);
    await appearanceToggle.click();
    await expect.poll(() => getIsDark(page)).toBe(!defaultIsDark);
    await appearanceToggle.click();
    await expect.poll(() => getIsDark(page)).toBe(defaultIsDark);
  });

  test('preserves the social preview link destination', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.locator('.rp-social-links__item a[href="/zh"]').first(),
    ).toHaveAttribute('href', '/zh');
  });

  test('globalStyles should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const link = page.locator('.rp-doc a').first();
    await expect(link).toHaveCSS('color', 'rgb(255, 165, 0)');
  });
});

test.describe('themeConfig.darkMode', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | undefined;

  test.afterEach(async () => {
    if (app) {
      await killProcess(app);
      app = undefined;
    }
  });

  async function startApp(configFile: string) {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort, configFile);
  }

  test('true updates the root theme class when the system preference changes', async ({
    page,
  }) => {
    await startApp('rspress.true.config.ts');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await expect.poll(() => getIsDark(page)).toBe(true);

    await page.emulateMedia({ colorScheme: 'light' });
    await expect.poll(() => getIsDark(page)).toBe(false);
  });

  test('dark sets the root theme class despite a light system preference', async ({
    page,
  }) => {
    await startApp('rspress.dark.config.ts');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await expect.poll(() => getIsDark(page)).toBe(true);
  });

  test('force-dark ignores saved preferences and hides the switch', async ({
    page,
  }) => {
    await startApp('rspress.force-dark.config.ts');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.addInitScript(() => {
      localStorage.setItem('rspress-theme-appearance', 'light');
    });
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    await expect.poll(() => getIsDark(page)).toBe(true);
    await expect(page.locator('.rp-switch-appearance')).toHaveCount(0);
  });
});

test.describe('CLI base option', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>> | undefined;

  test.afterEach(async () => {
    if (app) {
      await killProcess(app);
      app = undefined;
    }
  });

  test('prefixes production stylesheet and script URLs with the CLI base', async ({
    page,
  }) => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    await runBuildCommand(appDir, undefined, ['--base', CLI_BASE]);
    app = await runPreviewCommand(appDir, appPort, ['--base', CLI_BASE]);

    await page.goto(`http://localhost:${appPort}${CLI_BASE}`, {
      waitUntil: 'networkidle',
    });
    const assetUrls = await page.evaluate(() =>
      [
        ...[
          ...document.querySelectorAll<HTMLLinkElement>(
            'link[rel="stylesheet"]',
          ),
        ].map(element => element.getAttribute('href')),
        ...[...document.querySelectorAll<HTMLScriptElement>('script[src]')].map(
          element => element.getAttribute('src'),
        ),
      ].filter(Boolean),
    );
    expect(assetUrls.length).toBeGreaterThan(0);
    expect(assetUrls.every(url => url?.startsWith(CLI_BASE))).toBe(true);
  });
});

test.describe('SSG dark mode no flash', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;

  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
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
