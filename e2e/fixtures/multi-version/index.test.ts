import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('Multi version test', async () => {
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

  test('Default version and default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v1');
  });

  test('Not Default version default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/v2`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v2');
  });

  test('Default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/zh`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v1 中文');
  });

  test('Not default version not default language', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/base/v2/zh`, {
      waitUntil: 'networkidle',
    });
    const h1 = page.locator('h1');
    await expect(h1).toContainText('v2 中文');
  });

  test('Home feature icon should include base with multi-version and i18n', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/base/v2/zh/home`, {
      waitUntil: 'networkidle',
    });
    const featureIcon = page.locator('.rp-home-feature__icon img').first();
    await expect(featureIcon).toHaveAttribute('src', '/base/home/ai.svg');
  });
});
