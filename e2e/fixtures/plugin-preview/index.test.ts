import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@e2e/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin preview development', async () => {
  let appPort;
  let app;
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

  test('preserves three development code containers', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.locator('.rspress-doc > div[class*=language-]'),
    ).toHaveCount(3);
    await expect(page.locator('iframe')).toHaveCount(1);
  });

  test('preserves mixed preview container counts', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/mixed`, {
      waitUntil: 'networkidle',
    });
    await expect(page.locator('.rp-preview--internal__card')).toHaveCount(2);
    await expect(page.locator('.rp-preview--iframe-follow')).toHaveCount(2);
    await expect(page.locator('.rp-fixed-device')).toHaveCount(1);
    await expect(
      page.locator('.rp-preview--iframe-follow__device iframe'),
    ).toHaveCount(2);
    await expect(page.locator('.rp-fixed-device__iframe')).toHaveCount(1);
  });

  test('iframe dark mode', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/mixed`, {
      waitUntil: 'networkidle',
    });

    // Toggle to dark mode
    await page.click('.rp-switch-appearance');

    // Wait a bit for the theme change message to be posted to iframes
    await page.waitForTimeout(200);

    // Test iframe-follow dark mode
    const iframeFollowBlocks = page.locator('.rp-preview--iframe-follow');
    const iframeFollow = iframeFollowBlocks
      .first()
      .locator('.rp-preview--iframe-follow__device iframe');
    const iframeFollowHtml = iframeFollow.contentFrame().locator('html');
    await expect(iframeFollowHtml).toHaveClass(/dark/);

    // Test iframe-fixed dark mode
    const fixedDevice = page.locator('.rp-fixed-device');
    const fixedIframe = fixedDevice.locator('.rp-fixed-device__iframe');
    const fixedIframeHtml = fixedIframe.contentFrame().locator('html');
    await expect(fixedIframeHtml).toHaveClass(/dark/);

    // Toggle back to light mode
    await page.click('.rp-switch-appearance');
    await page.waitForTimeout(200);

    // Verify dark class is removed
    await expect(iframeFollowHtml).not.toHaveClass(/dark/);
    await expect(fixedIframeHtml).not.toHaveClass(/dark/);
  });

  test('iframe-follow resizer', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`http://localhost:${appPort}/mixed`, {
      waitUntil: 'networkidle',
    });

    const block = page.locator('.rp-preview--iframe-follow').first();
    const resizer = block.locator('.rp-preview--iframe-follow__resizer');
    const device = block.locator('.rp-preview--iframe-follow__device');
    await expect(resizer).toBeVisible();

    const initial = (await device.boundingBox())!.width;
    const box = (await resizer.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x - 50, y, { steps: 5 });
    await page.mouse.move(x - 100, y, { steps: 5 });
    await page.mouse.up();

    const resized = (await device.boundingBox())!.width;
    expect(Math.abs(resized - initial - 100)).toBeLessThanOrEqual(2);

    // keyboard
    await resizer.focus();
    await page.keyboard.press('ArrowRight');
    const afterKey = (await device.boundingBox())!.width;
    expect(Math.abs(resized - afterKey - 16)).toBeLessThanOrEqual(2);

    // double-click resets
    await resizer.dblclick();
    const reset = (await device.boundingBox())!.width;
    expect(Math.abs(reset - initial)).toBeLessThanOrEqual(2);

    // hidden in column layout
    await page.setViewportSize({ width: 800, height: 900 });
    await expect(resizer).toBeHidden();
  });
});

test.describe('plugin preview build', async () => {
  let appPort: number;
  let app;
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
  test('preserves three production code containers', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    await expect(
      page.locator('.rspress-doc > div[class*=language-]'),
    ).toHaveCount(3);
    await expect(page.locator('iframe')).toHaveCount(1);
  });

  test('omits the demo build directory when no iframe preview is configured', async () => {
    const appDir = import.meta.dirname;
    const distDir = path.join(appDir, 'doc_build');

    await fs.rm(distDir, { recursive: true, force: true });
    await runBuildCommand(appDir, 'rspress.no-iframe.config.ts');
    await expect(fs.access(path.join(distDir, '~demo'))).rejects.toThrow();
  });
});
