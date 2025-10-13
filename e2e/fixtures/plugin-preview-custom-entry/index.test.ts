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
    const codeBlockElements = page.locator('.rspress-doc > .rspress-preview');
    await expect(codeBlockElements).toHaveCount(4);

    const internalIframeJsxDemoCodePreview = await page
      .frameLocator('iframe')
      .first()
      .getByText('JSX')
      .innerText();
    const internalIframeTsxDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(1)
      .getByText('TSX')
      .innerText();
    const externalIframeJsxDemoCodePreview = await page
      .frameLocator('iframe')
      .nth(2)
      .getByText('EXTERNAL')
      .innerText();
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .nth(3)
      .getByText('VUE')
      .innerText();

    expect(internalIframeJsxDemoCodePreview).toBe('Hello World JSX');
    expect(internalIframeTsxDemoCodePreview).toBe('Hello World TSX');
    expect(externalIframeJsxDemoCodePreview).toBe('Hello World External');
    expect(transformedCodePreview).toBe('Hello World VUE');
  });
});
