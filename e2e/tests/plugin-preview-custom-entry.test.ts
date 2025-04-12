import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-preview-custom-entry');
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
    const codeBlockElements = await page.$$('.rspress-doc > .rspress-preview');

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .first()
      .getByText('JSX')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(1)
      .getByText('TSX')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .nth(2)
      .getByText('VUE')
      .innerText();

    expect(codeBlockElements.length).toBe(3);
    expect(internalDemoCodePreview).toBe('Hello World JSX');
    expect(externalDemoCodePreview).toBe('Hello World TSX');
    expect(transformedCodePreview).toBe('Hello World VUE');
  });
});
