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

    // First code block has lineNumbers meta
    const codeBlockWithLineNumbers = page
      .locator('.rp-codeblock__content')
      .first();
    const preWithLineNumbers = codeBlockWithLineNumbers.locator('pre');
    await expect(preWithLineNumbers).toHaveClass(/has-line-number/);

    // Third code block has wrapCode meta
    const codeBlockWithWrap = page.locator('.rp-codeblock__content').nth(2);
    const preWithWrap = codeBlockWithWrap.locator('pre');
    await expect(preWithWrap).toHaveClass(/has-wrap-code/);
    await expect(codeBlockWithWrap).toHaveClass(
      /rp-codeblock__content--code-wrap/,
    );

    // Fifth code block has both attributes
    const codeBlockWithBoth = page.locator('.rp-codeblock__content').nth(4);
    const preWithBoth = codeBlockWithBoth.locator('pre');
    await expect(preWithBoth).toHaveClass(/has-line-number/);
    await expect(preWithBoth).toHaveClass(/has-wrap-code/);
  });
});
