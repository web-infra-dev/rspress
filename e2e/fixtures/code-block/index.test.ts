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
    await expect(shikiDoms).toHaveCount(6);

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

  test('should support lineNumbers and wrapCode meta attributes', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/metaAttributes`, {
      waitUntil: 'networkidle',
    });

    // First code block has lineNumbers meta - check if lineNumbers property is set
    const codeBlockWithLineNumbers = page
      .locator('.rp-codeblock__content')
      .first();
    const preWithLineNumbers = codeBlockWithLineNumbers.locator('pre');
    // Check if the pre element has lineNumbers attribute/property
    const hasLineNumbersProp = await preWithLineNumbers.evaluate(
      node => 'lineNumbers' in node || node.hasAttribute('lineNumbers'),
    );
    expect(hasLineNumbersProp).toBe(true);

    // Third code block has wrapCode meta - check if wrapCode property is set and wrapping is applied
    const codeBlockWithWrap = page.locator('.rp-codeblock__content').nth(2);
    const preWithWrap = codeBlockWithWrap.locator('pre');
    // Check if the pre element has wrapCode attribute/property
    const hasWrapCodeProp = await preWithWrap.evaluate(
      node => 'wrapCode' in node || node.hasAttribute('wrapCode'),
    );
    expect(hasWrapCodeProp).toBe(true);
    // The parent div should have the wrapping class applied by the React component
    await expect(codeBlockWithWrap).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );

    // Fifth code block has both attributes
    const codeBlockWithBoth = page.locator('.rp-codeblock__content').nth(4);
    const preWithBoth = codeBlockWithBoth.locator('pre');
    // Check if both properties are set
    const hasBothProps = await preWithBoth.evaluate(
      node =>
        ('lineNumbers' in node || node.hasAttribute('lineNumbers')) &&
        ('wrapCode' in node || node.hasAttribute('wrapCode')),
    );
    expect(hasBothProps).toBe(true);
    // Should have wrapping class applied
    await expect(codeBlockWithBoth).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );
  });
});
