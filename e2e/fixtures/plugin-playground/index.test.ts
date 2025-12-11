import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

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

    const playgroundElements = page.locator('.rspress-playground');
    await expect(playgroundElements).toHaveCount(3);

    const internalDemoCodePreviewDefault = page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World Internal (default)');

    const internalDemoCodePreviewVertical = page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World Internal (vertical)');

    const externalDemoCodePreview = page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World External');

    await expect(internalDemoCodePreviewDefault).toHaveCount(1);
    await expect(internalDemoCodePreviewVertical).toHaveCount(1);
    await expect(externalDemoCodePreview).toHaveCount(1);
  });
});
