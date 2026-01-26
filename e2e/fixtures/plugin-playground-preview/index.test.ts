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

  test('Should render playground elements when both plugins are configured', async ({
    page,
  }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    // plugin-playground should take precedence and remove plugin-preview
    // So we should see playground elements, not preview elements
    const playgroundElements = page.locator('.rspress-playground');
    await expect(playgroundElements).toHaveCount(2);

    // Verify playground renders correctly
    const internalDemoCodePreview = page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World Playground');

    const externalDemoCodePreview = page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World External');

    await expect(internalDemoCodePreview).toHaveCount(1);
    await expect(externalDemoCodePreview).toHaveCount(1);

    // Verify preview elements are not rendered (plugin-preview was removed)
    const previewElements = page.locator('.rp-preview--internal__card');
    await expect(previewElements).toHaveCount(0);
  });
});
