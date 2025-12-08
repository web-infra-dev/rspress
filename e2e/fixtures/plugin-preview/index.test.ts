import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

const HMR_TEST_FILE = path.resolve(__dirname, 'doc/hmr.mdx');

test.describe('plugin test', async () => {
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

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = page.locator(
      '.rspress-doc > div[class*=language-]',
    );
    await expect(codeBlockElements).toHaveCount(3);

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    expect(internalDemoCodePreview).toBe('Hello World Internal');
    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });

  test('mixed page', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/mixed`, {
      waitUntil: 'networkidle',
    });

    // ========================================================================
    // Test preview="internal" blocks (2 total: 1 inline + 1 external file)
    // ========================================================================
    const internalCards = page.locator('.rp-preview--internal__card');
    await expect(internalCards).toHaveCount(2);

    // First internal card: inline code with preview="internal"
    await expect(internalCards.nth(0)).toContainText('This is a component');
    // Second internal card: external file with preview="internal"
    await expect(internalCards.nth(1)).toContainText('Hello World External');

    // ========================================================================
    // Test preview="iframe-follow" blocks (2 total: 1 inline + 1 external file)
    // ========================================================================
    const iframeFollowBlocks = page.locator('.rp-preview--iframe-follow');
    await expect(iframeFollowBlocks).toHaveCount(2);

    // First iframe-follow: inline code
    const iframeFollow1 = iframeFollowBlocks
      .nth(0)
      .locator('.rp-preview--iframe-follow__device iframe');
    await expect(iframeFollow1.contentFrame().locator('body')).toContainText(
      'This is a component',
    );

    // Second iframe-follow: external file
    const iframeFollow2 = iframeFollowBlocks
      .nth(1)
      .locator('.rp-preview--iframe-follow__device iframe');
    await expect(iframeFollow2.contentFrame().locator('body')).toContainText(
      'Hello World External',
    );

    // ========================================================================
    // Test preview="iframe-fixed" and preview (default) blocks
    // These render in a fixed device panel, 4 total:
    // - 2 inline: preview (default=iframe-fixed), preview="iframe-fixed"
    // - 2 external: preview (default=iframe-fixed), preview="iframe-fixed"
    // ========================================================================
    const fixedDevice = page.locator('.rp-fixed-device');
    await expect(fixedDevice).toHaveCount(1);

    // The fixed device iframe should contain demos from all iframe-fixed blocks
    const fixedIframe = fixedDevice.locator('.rp-fixed-device__iframe');
    const fixedIframeBody = fixedIframe.contentFrame().locator('body');

    // Should contain both inline and external component text
    await expect(fixedIframeBody).toContainText('This is a component');
    await expect(fixedIframeBody).toContainText('Hello World External');
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
  test('build should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = await page.$$(
      '.rspress-doc > div[class*=language-]',
    );

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    expect(codeBlockElements.length).toBe(3);
    expect(internalDemoCodePreview).toBe('Hello World Internal');
    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });
});

test.describe('plugin preview HMR', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
  let originalContent: string;

  test.beforeAll(async () => {
    const appDir = __dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    originalContent = await fs.readFile(HMR_TEST_FILE, 'utf-8');
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    // Restore original content
    await fs.writeFile(HMR_TEST_FILE, originalContent);
  });

  test('HMR for preview="internal"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/hmr`, {
      waitUntil: 'networkidle',
    });

    // Verify initial content
    const internalCard = page.locator('.rp-preview--internal__card').first();
    await expect(internalCard).toContainText('HMR Internal Original');

    // Modify the file
    const updatedContent = originalContent.replace(
      'HMR Internal Original',
      'HMR Internal Updated',
    );
    await fs.writeFile(HMR_TEST_FILE, updatedContent);

    // Wait for HMR to apply
    await expect(internalCard).toContainText('HMR Internal Updated');

    // Restore for next test
    await fs.writeFile(HMR_TEST_FILE, originalContent);
  });

  test('HMR for preview="iframe-follow"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/hmr`, {
      waitUntil: 'networkidle',
    });

    // Verify initial content in iframe
    const iframeFollowBlock = page.locator('.rp-preview--iframe-follow');
    const iframe = iframeFollowBlock.locator(
      '.rp-preview--iframe-follow__device iframe',
    );
    await expect(iframe.contentFrame().locator('body')).toContainText(
      'HMR Iframe Follow Original',
    );

    // Modify the file
    const updatedContent = originalContent.replace(
      'HMR Iframe Follow Original',
      'HMR Iframe Follow Updated',
    );
    await fs.writeFile(HMR_TEST_FILE, updatedContent);

    // Wait for HMR to apply
    await expect(iframe.contentFrame().locator('body')).toContainText(
      'HMR Iframe Follow Updated',
    );

    // Restore for next test
    await fs.writeFile(HMR_TEST_FILE, originalContent);
  });

  test('HMR for preview="iframe-fixed"', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/hmr`, {
      waitUntil: 'networkidle',
    });

    // Verify initial content in fixed device iframe
    const fixedDevice = page.locator('.rp-fixed-device');
    const fixedIframe = fixedDevice.locator('.rp-fixed-device__iframe');
    await expect(fixedIframe.contentFrame().locator('body')).toContainText(
      'HMR Iframe Fixed Original',
    );

    // Modify the file
    const updatedContent = originalContent.replace(
      'HMR Iframe Fixed Original',
      'HMR Iframe Fixed Updated',
    );
    await fs.writeFile(HMR_TEST_FILE, updatedContent);

    // Wait for HMR to apply
    await expect(fixedIframe.contentFrame().locator('body')).toContainText(
      'HMR Iframe Fixed Updated',
    );

    // Restore for next test
    await fs.writeFile(HMR_TEST_FILE, originalContent);
  });
});
