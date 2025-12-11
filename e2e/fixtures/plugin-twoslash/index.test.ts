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

    const count = await triggers.count();
    for (let i = 0; i < count; i++) {
      const trigger = triggers.nth(i);
      const container = trigger.locator('twoslash-popup-container');
      await expect(container).toBeAttached();

      const initialized = await container.getAttribute('data-initialized');
      expect(initialized).toBeNull();

      const inner = container.locator('.twoslash-popup-inner');
      await expect(inner).toBeAttached();
      const arrow = container.locator('.twoslash-popup-arrow');
      await expect(arrow).toBeAttached();
    }
  });

  test('should clone twoslash popup elements', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const portal = page.locator('twoslash-popup-portal');
    await expect(portal).toBeAttached();

    const containers = portal.locator('twoslash-popup-container');
    await expect(containers).toHaveCount(10);

    const extractTypeAlways = await containers
      .nth(1)
      .getAttribute('data-always');
    expect(extractTypeAlways).toBe('true');

    const completionsAlways = await containers
      .nth(4)
      .getAttribute('data-always');
    expect(completionsAlways).toBe('true');

    const count = await containers.count();
    for (let i = 0; i < count; i++) {
      const container = containers.nth(i);
      const initialized = await container.getAttribute('data-initialized');
      expect(initialized).not.toBeNull();

      const inner = container.locator('.twoslash-popup-inner');
      await expect(inner).toBeAttached();
      const arrow = container.locator('.twoslash-popup-arrow');
      await expect(arrow).toBeAttached();
    }
  });

  test('should highlight code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = page.locator(
      'h2:has-text("Highlighting") + .language-ts',
    );
    await expect(codeBlock).toBeAttached();

    const highlighted = codeBlock.locator('.twoslash-highlighted');
    await expect(highlighted).toBeAttached();
  });

  test('should show errors in code blocks with twoslash', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    const codeBlock = page.locator('h2:has-text("Error") + .language-ts');
    await expect(codeBlock).toBeAttached();

    const error = codeBlock.locator('.twoslash-error');
    await expect(error).toBeAttached();

    const errorLine = codeBlock.locator('.twoslash-error-line');
    await expect(errorLine).toBeAttached();
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
    await expect(codeBlock).toBeAttached();

    const triggers = codeBlock.locator('twoslash-popup-trigger');
    await expect(triggers).toHaveCount(0);
  });
});
