import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

test.describe('plugin-playground-preview combined test', async () => {
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

  test('Both plugins work together with explicit meta', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    // Pure code block (default) - should render as normal code block
    const pureCodeBlock = page.locator('pre code').filter({
      hasText: 'PureComponent',
    });
    await expect(pureCodeBlock).toHaveCount(1);

    // Playground element - should render with playground meta
    const playgroundElements = page.locator('.rspress-playground');
    await expect(playgroundElements).toHaveCount(1);

    const playgroundContent = page
      .locator('.rspress-playground .rspress-playground-runner')
      .getByText('Hello World Playground');
    await expect(playgroundContent).toBeVisible();

    // Preview element - should render with preview meta
    const previewElements = page.locator('.rspress-preview');
    await expect(previewElements).toHaveCount(1);

    const previewContent = page
      .locator('.rp-preview .rp-preview--internal__card__content')
      .getByText('Hello World Preview');
    await expect(previewContent).toBeVisible();
  });
});
