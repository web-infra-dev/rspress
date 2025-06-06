import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('<CodeBlockRuntime />', async () => {
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

  test('<CodeBlockRuntime /> should render title and code with correct language', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const containers = await page.$$('div.language-js');
    expect(containers.length).toBe(2);

    // CodeBlockRuntime should render the same result with compile-time code block
    for (const container of containers) {
      const title = await container.$('.rspress-code-title');
      expect(await title!.textContent()).toBe('test.js');
      const content = await container.$('.rspress-code-content');
      expect(
        await content!.evaluate(el =>
          el.classList.contains('rspress-scrollbar'),
        ),
      ).toBe(true);
      const shikiContainer = await content?.$('.shiki.css-variables');
      expect(await shikiContainer?.evaluate(el => el.tagName)).toBe('PRE');
      expect(await shikiContainer?.$eval('code', el => el.textContent)).toBe(
        "console.log('Hello CodeBlock!');",
      );
    }
  });

  test('shiki transformerNotationHighlight should work', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/highlight`, {
      waitUntil: 'networkidle',
    });
    const containers = await page.$$('div.language-ts');
    expect(containers.length).toBe(2);

    // CodeBlockRuntime should render the same result with compile-time code block
    for (const container of containers) {
      const title = await container.$('.rspress-code-title');
      expect(await title!.textContent()).toBe('highlight.ts');
      const content = await container.$('.rspress-code-content');
      expect(
        await content!.evaluate(el =>
          el.classList.contains('rspress-scrollbar'),
        ),
      ).toBe(true);
      const shikiContainer = await content?.$('.shiki.css-variables');
      expect(await shikiContainer?.evaluate(el => el.tagName)).toBe('PRE');
      expect(await shikiContainer?.$eval('code', el => el.textContent)).toBe(
        "console.log('Highlighted'); \nconsole.log('Highlighted');\nconsole.log('Not highlighted');",
      );
    }
  });
});
