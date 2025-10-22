import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('<CodeBlockRuntime />', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runDevCommand>>;
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

  test('<CodeBlockRuntime /> should render title and code with correct language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const containers = page.locator('div.language-js');
    await expect(containers).toHaveCount(2);

    const containerCount = await containers.count();
    for (let index = 0; index < containerCount; index += 1) {
      const container = containers.nth(index);
      await expect(container.locator('.rp-codeblock__title')).toHaveText(
        'test.js',
      );
      const content = container.locator('.rp-codeblock__content');
      const shikiContainer = content.locator('.shiki.css-variables').first();
      await expect(shikiContainer).toHaveJSProperty('tagName', 'PRE');
      await expect(shikiContainer.locator('code').first()).toHaveText(
        "console.log('Hello CodeBlock!');",
      );
    }
  });

  test('shiki transformerNotationHighlight should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/highlight`, {
      waitUntil: 'networkidle',
    });
    const containers = page.locator('div.language-ts');
    await expect(containers).toHaveCount(2);

    const containerCount = await containers.count();
    for (let index = 0; index < containerCount; index += 1) {
      const container = containers.nth(index);
      await expect(container.locator('.rp-codeblock__title')).toHaveText(
        'highlight.ts',
      );
      const content = container.locator('.rp-codeblock__content');
      const shikiContainer = content.locator('.shiki.css-variables').first();
      await expect(shikiContainer).toHaveJSProperty('tagName', 'PRE');
      await expect(shikiContainer.locator('code').first()).toHaveText(
        "console.log('Highlighted'); \nconsole.log('Highlighted');\nconsole.log('Not highlighted');",
      );
    }
  });
});
