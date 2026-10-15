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
