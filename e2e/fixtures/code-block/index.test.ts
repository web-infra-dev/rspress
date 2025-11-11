import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

test.describe('plugin shiki test', async () => {
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

  test('should render shiki code block successfully', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const shikiDoms = page.locator('.rp-codeblock__content');
    await expect(shikiDoms).toHaveCount(9);

    const firstShikiDom = shikiDoms.first();

    expect(
      await firstShikiDom
        .locator('code')
        .evaluate(node =>
          node.computedStyleMap().get('white-space')?.toString(),
        ),
    ).toBe('pre');

    await firstShikiDom.locator('button[title="Toggle code wrap"]').click();
    expect(
      await firstShikiDom
        .locator('code')
        .evaluate(node =>
          node.computedStyleMap().get('white-space')?.toString(),
        ),
    ).toBe('pre-wrap');
  });

  test('langAlias', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/langAlias`, {
      waitUntil: 'networkidle',
    });
    const shikiDoms = page.locator('.rp-codeblock__content');
    await expect(shikiDoms).toHaveCount(1);
  });

  test('should support lineNumbers meta attribute', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Get the 7th code block (first one with lineNumbers meta)
    const codeBlockWithLineNumbers = page
      .locator('.rp-codeblock__content')
      .nth(6);
    const preElement = codeBlockWithLineNumbers.locator('pre');

    // Should have has-line-number class
    await expect(preElement).toHaveClass(/has-line-number/);

    // Should have line-number class on lines
    const lines = preElement.locator('.line-number');
    await expect(lines.first()).toBeVisible();
  });

  test('should support wrapCode meta attribute', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Get the 8th code block (one with wrapCode meta)
    const codeBlockWithWrap = page.locator('.rp-codeblock__content').nth(7);
    const preElement = codeBlockWithWrap.locator('pre');

    // Should have has-wrap-code class
    await expect(preElement).toHaveClass(/has-wrap-code/);

    // The content div should have code-wrap class applied
    await expect(codeBlockWithWrap).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );

    // Code should have pre-wrap white-space
    expect(
      await codeBlockWithWrap
        .locator('code')
        .evaluate(node =>
          node.computedStyleMap().get('white-space')?.toString(),
        ),
    ).toBe('pre-wrap');
  });

  test('should support both lineNumbers and wrapCode meta attributes', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // Get the 9th code block (one with both meta attributes)
    const codeBlockWithBoth = page.locator('.rp-codeblock__content').nth(8);
    const preElement = codeBlockWithBoth.locator('pre');

    // Should have both classes
    await expect(preElement).toHaveClass(/has-line-number/);
    await expect(preElement).toHaveClass(/has-wrap-code/);

    // Should have line numbers
    const lines = preElement.locator('.line-number');
    await expect(lines.first()).toBeVisible();

    // Should wrap code
    await expect(codeBlockWithBoth).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );
  });

  test('should respect global showLineNumbers config', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });

    // The first code block should have line numbers from global config
    const firstCodeBlock = page.locator('.rp-codeblock__content').first();
    const firstPreElement = firstCodeBlock.locator('pre');

    // Should have has-line-number class from global config
    await expect(firstPreElement).toHaveClass(/has-line-number/);
  });

  test('meta attributes page - lineNumbers without global config', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/metaAttributes`, {
      waitUntil: 'networkidle',
    });

    // First code block has lineNumbers meta
    const codeBlockWithMeta = page.locator('.rp-codeblock__content').first();
    const preWithMeta = codeBlockWithMeta.locator('pre');
    await expect(preWithMeta).toHaveClass(/has-line-number/);

    // Second code block doesn't have lineNumbers meta but has global config
    // Since global config is enabled, it should still have line numbers
    const codeBlockWithoutMeta = page.locator('.rp-codeblock__content').nth(1);
    const preWithoutMeta = codeBlockWithoutMeta.locator('pre');
    await expect(preWithoutMeta).toHaveClass(/has-line-number/);
  });

  test('meta attributes page - wrapCode attribute', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/metaAttributes`, {
      waitUntil: 'networkidle',
    });

    // Third code block has wrapCode meta
    const codeBlockWithWrap = page.locator('.rp-codeblock__content').nth(2);
    const preWithWrap = codeBlockWithWrap.locator('pre');
    await expect(preWithWrap).toHaveClass(/has-wrap-code/);
    await expect(codeBlockWithWrap).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );

    // Fourth code block doesn't have wrapCode meta and no global config for wrap
    const codeBlockWithoutWrap = page.locator('.rp-codeblock__content').nth(3);
    const preWithoutWrap = codeBlockWithoutWrap.locator('pre');
    await expect(preWithoutWrap).not.toHaveClass(/has-wrap-code/);
    await expect(codeBlockWithoutWrap).not.toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );
  });
});
