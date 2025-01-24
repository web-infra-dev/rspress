import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-playground');
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

    const playgroundElements = await page.$$('.rspress-playground');

    const internalDemoCodePreviewDefault = await page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World Internal (default)');

    const internalDemoCodePreviewVertical = await page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World Internal (vertical)');

    const externalDemoCodePreview = await page
      .locator('.rspress-playground > .rspress-playground-runner > div')
      .getByText('Hello World External');

    expect(playgroundElements.length).toBe(3);
    expect(await internalDemoCodePreviewDefault.count()).toBe(1);
    expect(await internalDemoCodePreviewVertical.count()).toBe(1);
    expect(await externalDemoCodePreview.count()).toBe(1);
  });
});
