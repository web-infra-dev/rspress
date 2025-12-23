import { expect, test } from '@playwright/test';
import {
  getPort,
  killProcess,
  runBuildCommand,
  runDevCommand,
  runPreviewCommand,
} from '../../utils/runCommands';

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

test.describe('<CodeBlockRuntime /> SSG', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;
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

  test('should render code from static HTML when JavaScript is disabled', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'domcontentloaded',
      });

      const containers = page.locator('div.language-js');
      await expect(containers).toHaveCount(2);
      const codeElement = containers
        .locator('.rp-codeblock__content pre code')
        .first();
      await expect(codeElement).toHaveText("console.log('Hello CodeBlock!');");
    } finally {
      await context.close();
    }
  });
});
