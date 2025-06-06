import path from 'node:path';
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
    const codeBlockElements = await page.$$(
      '.rspress-doc > div[class*=language-]',
    );

    const internalDemoCodePreview = await page
      .frameLocator('iframe')
      .getByText('Internal')
      .innerText();
    // FIXME: support this usage of plugin-preview
    // const externalDemoCodePreview = await page
    //   .frameLocator('iframe')
    //   .getByText('External')
    //   .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('JSON')
      .innerText();

    // expect(codeBlockElements.length).toBe(3);
    expect(codeBlockElements.length).toBe(2);
    expect(internalDemoCodePreview).toBe('Hello World Internal');
    // expect(externalDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Render from JSON');
  });
});
