import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

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
