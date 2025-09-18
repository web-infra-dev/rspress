import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin twoslash test', async () => {
  let appPort: number;
  let app: unknown;
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

  test('should render twoslash popup elements', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const triggers = page.locator('twoslash-popup-trigger');
    await expect(triggers).toHaveCount(10);

    for (const trigger of await triggers.all()) {
      const container = trigger.locator('twoslash-popup-container');
      await expect(container).toBeVisible();

      await expect(container).not.toHaveAttribute('data-initialized');

      const inner = container.locator('.twoslash-popup-inner');
      await expect(inner).toBeVisible();

      const arrow = container.locator('.twoslash-popup-arrow');
      await expect(arrow).toBeVisible();
    }
  });

  test('should clone twoslash popup elements', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const portal = page.locator('twoslash-popup-portal');
    await expect(portal).toBeVisible();

    const containers = portal.locator('twoslash-popup-container');
    await expect(containers).toHaveCount(10);

    await expect(containers.nth(1)).toHaveAttribute('data-always', 'true');
    await expect(containers.nth(4)).toHaveAttribute('data-always', 'true');

    for (const container of await containers.all()) {
      await expect(container).toHaveAttribute('data-initialized');

      const inner = container.locator('.twoslash-popup-inner');
      await expect(inner).toBeVisible();

      const arrow = container.locator('.twoslash-popup-arrow');
      await expect(arrow).toBeVisible();
    }
  });

  test('should highlight code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = page.locator(
      'h2:has-text("Highlighting") + .language-ts',
    );
    await expect(codeBlock).toBeVisible();

    const highlighted = codeBlock.locator('.twoslash-highlighted');
    await expect(highlighted).toBeVisible();
  });

  test('should show errors in code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = page.locator('h2:has-text("Error") + .language-ts');
    await expect(codeBlock).toBeVisible();

    const error = codeBlock.locator('.twoslash-error');
    await expect(error).toBeVisible();

    const errorLine = codeBlock.locator('.twoslash-error-line');
    await expect(errorLine).toBeVisible();
  });

  test('should not apply twoslash to code blocks without twoslash', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = page.locator(
      'h2:has-text("Disable twoslash") + .language-ts',
    );
    await expect(codeBlock).toBeVisible();

    const triggers = codeBlock.locator('twoslash-popup-trigger');
    await expect(triggers).toHaveCount(0);
  });
});
