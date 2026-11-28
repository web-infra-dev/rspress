import path from 'node:path';
import { expect, test as baseTest } from '@e2e/test';
import { runBuildCommand } from '../../utils/runCommands';

const test = baseTest.extend<{ appUrl: string }>({
  appUrl: async ({ serve }, use) => {
    const { url } = await serve(path.join(import.meta.dirname, 'doc_build'));
    await use(url);
  },
});

test.describe('Shiki code blocks', async () => {
  test.beforeAll(async () => {
    await runBuildCommand(import.meta.dirname);
  });

  test('should render shiki code block successfully', async ({
    page,
    appUrl,
  }) => {
    await page.goto(appUrl, {
      waitUntil: 'load',
    });
    const shikiDoms = page.locator('.rp-codeblock__content');
    await expect(shikiDoms).toHaveCount(7);

    await expect(shikiDoms.first().locator('.line.diff.remove')).toHaveCount(1);
    await expect(shikiDoms.first().locator('.line.diff.add')).toHaveCount(1);
    await expect(shikiDoms.nth(2).locator('.line.error')).toHaveCount(1);
    await expect(shikiDoms.nth(2).locator('.line.warning')).toHaveCount(1);
    await expect(shikiDoms.nth(3).locator('.line.focused')).toHaveCount(1);
    await expect(shikiDoms.nth(4).locator('.line.highlighted')).toHaveCount(3);

    await expect(shikiDoms.nth(6).locator('.highlighted-word')).toHaveText(
      'highlighted',
    );

    await expect(shikiDoms.nth(6).locator('.highlighted-word')).toHaveCSS(
      'background-color',
      'rgba(59, 130, 246, 0.1)',
    );

    const firstShikiDom = shikiDoms.first();

    const code = firstShikiDom.locator('code');
    await expect(code).toHaveCSS('white-space', 'pre');

    await firstShikiDom
      .getByRole('button', { name: 'Toggle code wrap' })
      .click();
    await expect(code).toHaveCSS('white-space', 'pre-wrap');
  });

  test('langAlias', async ({ page, appUrl }) => {
    await page.goto(`${appUrl}/langAlias.html`, {
      waitUntil: 'load',
    });
    const shikiDoms = page.locator('.rp-codeblock__content');
    await expect(shikiDoms).toHaveCount(1);
  });

  test('should support lineNumbers and wrapCode meta attributes', async ({
    page,
    appUrl,
  }) => {
    await page.goto(`${appUrl}/metaAttributes.html`, {
      waitUntil: 'load',
    });

    // First code block has lineNumbers meta - check if lineNumbers property is set
    const codeBlockWithLineNumbers = page
      .locator('.rp-codeblock__content')
      .first();
    await expect(codeBlockWithLineNumbers).toHaveClass(
      /rp-codeblock__content--line-numbers/,
    );
    await expect(codeBlockWithLineNumbers).not.toHaveClass(
      /rp-codeblock__content--wrap-code/,
    );

    // Second code block has no meta - check if no extra class is applied
    const codeBlockWithoutBoth = page.locator('.rp-codeblock__content').nth(1);
    await expect(codeBlockWithoutBoth).not.toHaveClass(
      /rp-codeblock__content--line-numbers/,
    );
    await expect(codeBlockWithoutBoth).not.toHaveClass(
      /rp-codeblock__content--wrap-code/,
    );

    // Third code block has wrapCode meta - check if wrapCode property is set and wrapping is applied
    const codeBlockWithWrap = page.locator('.rp-codeblock__content').nth(2);
    await expect(codeBlockWithWrap).not.toHaveClass(
      /rp-codeblock__content--line-numbers/,
    );
    await expect(codeBlockWithWrap).toHaveClass(
      /rp-codeblock__content--wrap-code/,
    );

    // Fifth code block has both attributes
    const codeBlockWithBoth = page.locator('.rp-codeblock__content').nth(4);
    await expect(codeBlockWithBoth).toHaveClass(
      /rp-codeblock__content--line-numbers/,
    );
    await expect(codeBlockWithBoth).toHaveClass(
      /rp-codeblock__content--wrap-code/,
    );
  });
});
