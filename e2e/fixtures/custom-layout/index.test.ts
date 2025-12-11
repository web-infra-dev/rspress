import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('custom layout test', async () => {
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

  test('should hide doc chrome when disabled via frontmatter', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/frontmatter`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '#Frontmatter',
    );
    await expect(page.locator('header.rp-nav')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__sidebar')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__outline')).toHaveCount(0);
    await expect(page.locator('.rp-doc-footer')).toHaveCount(0);
  });

  test('should render home layout when pageType is home', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    await expect(page.locator('.rp-home-hero')).toBeVisible();
    await expect(page.locator('.rp-doc-layout__container')).toHaveCount(0);
    await expect(page.locator('header.rp-nav')).toBeVisible();
  });

  test('should render custom layout when pageType is custom', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/page-type`, {
      waitUntil: 'networkidle',
    });

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '#Page type',
    );
    await expect(page.locator('header.rp-nav')).toBeVisible();
    await expect(page.locator('.rp-home-hero')).toHaveCount(0);
    await expect(page.locator('.rp-doc-layout__container')).toHaveCount(0);
  });
});
