import { expect, test } from '@e2e/test';
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
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
  });

  test('renders three JavaScript containers with PRE markup', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}`, {
      waitUntil: 'networkidle',
    });
    const containers = page.locator('div.language-js');
    await expect(containers).toHaveCount(3);

    for (let index = 0; index < 3; index++) {
      const container = containers.nth(index);
      const shikiContainer = container
        .locator('.rp-codeblock__content .shiki.css-variables')
        .first();
      await expect(shikiContainer).toHaveJSProperty('tagName', 'PRE');
    }
  });

  test('preserves two transformed TypeScript containers with PRE markup', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/highlight`, {
      waitUntil: 'networkidle',
    });
    const containers = page.locator('div.language-ts');
    await expect(containers).toHaveCount(2);

    const containerCount = await containers.count();
    for (let index = 0; index < containerCount; index += 1) {
      const container = containers.nth(index);
      const content = container.locator('.rp-codeblock__content');
      const shikiContainer = content.locator('.shiki.css-variables').first();
      await expect(shikiContainer).toHaveJSProperty('tagName', 'PRE');
    }
  });
});

test.describe('<CodeBlockRuntime /> SSG', async () => {
  let appPort: number;
  let app: Awaited<ReturnType<typeof runPreviewCommand>>;
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

  test('renders three JavaScript containers without JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    try {
      await page.goto(`http://localhost:${appPort}`, {
        waitUntil: 'domcontentloaded',
      });

      const containers = page.locator('div.language-js');
      await expect(containers).toHaveCount(3);
    } finally {
      await context.close();
    }
  });
});
