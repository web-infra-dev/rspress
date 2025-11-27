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
    await page.goto(`http://localhost:${appPort}/guide/`, {
      waitUntil: 'networkidle',
    });
    const codeBlockElements = page.locator('.rspress-doc > .rp-preview');
    await expect(codeBlockElements).toHaveCount(3);

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

    expect(internalIframeJsxDemoCodePreview).toBe('Hello World JSX');
    expect(internalIframeTsxDemoCodePreview).toBe('Hello World TSX');
    expect(externalIframeJsxDemoCodePreview).toBe('Hello World External');
  });

  test('should render vue', async ({ page }) => {
    await page.goto(`http://localhost:${appPort}/guide/vue`, {
      waitUntil: 'networkidle',
    });
    const transformedCodePreview = await page
      .frameLocator('iframe')
      .getByText('VUE')
      .innerText();

    expect(transformedCodePreview).toBe('Hello World VUE');
  });
});
