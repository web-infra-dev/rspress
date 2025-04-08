import path from 'node:path';
import { expect, test } from '@playwright/test';
import { getPort, killProcess, runDevCommand } from '../utils/runCommands';

const fixtureDir = path.resolve(__dirname, '../fixtures');

test.describe('plugin test', async () => {
  let appPort;
  let app;
  let customEntryAppPort;
  let customEntryApp;
  test.beforeAll(async () => {
    const appDir = path.join(fixtureDir, 'plugin-preview');
    appPort = await getPort();
    app = await runDevCommand(appDir, appPort);
    const customEntryAppDir = path.join(
      fixtureDir,
      'plugin-preview-custom-entry',
    );
    customEntryAppPort = await getPort();
    customEntryApp = await runDevCommand(customEntryAppDir, customEntryAppPort);
  });

  test.afterAll(async () => {
    if (app) {
      await killProcess(app);
    }
    if (customEntryApp) {
      await killProcess(customEntryApp);
    }
  });

  test('Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = await page.$$(
      '.rspress-doc > div[class*=language-]',
    );

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    const externalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('External')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    expect(codeBlockElements.length).toBe(3);
    expect(internalDemoCodePreview).toBe('Hello World Internal');
    expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });

  test('custom entry Should render the element', async ({ page }) => {
    await page.goto(`http://localhost:${customEntryApp}/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = await page.$$(
      '.rspress-doc > div[class*=language-]',
    );

    const jsxDemoPreview = await page
      .frameLocator('iframe')
      .getByText('JSX')
      .innerText();
    const tsxDemoPreview = await page
      .frameLocator('iframe')
      .getByText('TSX')
      .innerText();
    const vueDemoPreview = await page
      .frameLocator('iframe')
      .getByText('VUE')
      .innerText();

    expect(codeBlockElements.length).toBe(3);
    expect(jsxDemoPreview).toBe('Hello World JSX');
    expect(tsxDemoPreview).toBe('Hello World TSX');
    expect(vueDemoPreview).toBe('Hello World VUE');
  });
});
