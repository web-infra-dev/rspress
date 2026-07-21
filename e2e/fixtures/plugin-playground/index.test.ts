import fs from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../../utils/runCommands';

const DOC_FILE = new URL('./doc/index.mdx', import.meta.url);

test.describe('plugin test', async () => {
  test.describe.configure({ mode: 'serial' });

  let appPort;
  let app;
  let originalContent: string;
  test.beforeAll(async () => {
    const appDir = import.meta.dirname;
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    originalContent = await fs.readFile(DOC_FILE, 'utf-8');
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    await fs.writeFile(DOC_FILE, originalContent);
  });

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const playgroundElements = page.locator('.rp-playground');
    await expect(playgroundElements).toHaveCount(3);

    const internalDemoCodePreviewDefault = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World Internal (default)');

    const internalDemoCodePreviewVertical = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World Internal (vertical)');

    const externalDemoCodePreview = page
      .locator('.rp-playground > .rp-playground-runner > div')
      .getByText('Hello World External');

    await expect(internalDemoCodePreviewDefault).toHaveCount(1);
    await expect(internalDemoCodePreviewVertical).toHaveCount(1);
    await expect(externalDemoCodePreview).toHaveCount(1);
  });

  test('Should update the rendered code through HMR', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });

    const updatedContent = originalContent.replace(
      'Hello World Internal (default)',
      'Hello World Internal (updated)',
    );
    await fs.writeFile(DOC_FILE, updatedContent);

    await expect(
      page
        .locator('.rp-playground > .rp-playground-runner > div')
        .getByText('Hello World Internal (updated)'),
    ).toHaveCount(1);
  });
});
